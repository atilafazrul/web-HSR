<?php

namespace App\Services;

use App\Models\DashboardBiaya;
use App\Models\Notification;
use App\Models\ProjekKerja;
use App\Models\User;
use Carbon\Carbon;

class BiayaNotificationService
{
    private const KATEGORI_LABELS = [
        'jalan' => 'Biaya Jalan',
        'pengeluaran' => 'Biaya Pengeluaran',
        'reimbursment' => 'Biaya Reimbursment',
    ];

    public function __construct(
        private readonly WhatsAppService $whatsAppService,
    ) {}

    public function notifyDashboardBiaya(DashboardBiaya $row, ?User $creator = null): void
    {
        $creator = $creator ?? auth()->user();
        if (! $creator || ($creator->role ?? null) === 'super_admin') {
            return;
        }

        $kategoriLabel = self::KATEGORI_LABELS[$row->kategori] ?? ucfirst((string) $row->kategori);
        $creatorName = trim((string) ($creator->name ?? 'Pengguna'));
        $divisi = trim((string) ($row->divisi ?? $creator->divisi ?? ''));
        $keterangan = trim((string) ($row->keterangan ?? ''));
        $period = $this->periodFromDate($row->created_at);

        $this->notifySuperAdmins(
            'biaya_diluar_projek',
            'Biaya baru di luar proyek',
            $this->formatBiayaAddedMessage($creatorName, $kategoriLabel, (float) $row->nominal, $keterangan),
            [
                'dashboard_biaya_id' => $row->id,
                'kategori' => $row->kategori,
                'nominal' => (float) $row->nominal,
                'keterangan' => $keterangan !== '' ? $keterangan : null,
                'created_by' => $creator->id,
                'created_by_name' => $creatorName,
                'nama_akun' => $creatorName,
                'divisi' => $divisi,
                'scope' => 'diluar_projek',
                'bulan' => $period['bulan'],
                'tahun' => $period['tahun'],
            ],
            $creator->id
        );
    }

    /**
     * @param  array<int, array<string, mixed>>  $changes
     */
    public function notifyProjectBiayaCreates(ProjekKerja $projek, array $changes, ?User $creator = null): void
    {
        $creator = $creator ?? auth()->user();
        if (! $creator || ($creator->role ?? null) === 'super_admin') {
            return;
        }

        $creates = array_values(array_filter(
            $changes,
            fn ($change) => is_array($change) && ($change['action'] ?? '') === 'create'
        ));

        if ($creates === []) {
            return;
        }

        $creatorName = trim((string) ($creator->name ?? 'Pengguna'));
        $reportNo = trim((string) ($projek->report_no ?? ''));
        if ($reportNo === '') {
            $reportNo = 'Proyek #'.$projek->id;
        }
        $divisi = trim((string) ($projek->divisi ?? ''));

        foreach ($creates as $change) {
            $kategori = (string) ($change['category'] ?? 'biaya');
            $kategoriLabel = self::KATEGORI_LABELS[$kategori] ?? ucfirst($kategori);
            $nominal = (float) ($change['nominal'] ?? 0);
            if ($nominal <= 0) {
                continue;
            }

            $oleh = trim((string) ($change['oleh'] ?? '')) ?: $creatorName;
            $keterangan = trim((string) ($change['keterangan'] ?? ''));
            $period = $this->periodFromDate($change['created_at'] ?? now());
            $itemIndex = $this->findProjectItemIndex($projek, $kategori, $change);

            $this->notifySuperAdmins(
                'biaya_projek',
                'Biaya baru di proyek',
                $this->formatBiayaAddedMessage(
                    $oleh,
                    $kategoriLabel,
                    $nominal,
                    $keterangan,
                    $reportNo,
                    $projek->jenis_pekerjaan
                ),
                [
                    'projek_kerja_id' => $projek->id,
                    'report_no' => $projek->report_no,
                    'divisi' => $divisi,
                    'kategori' => $kategori,
                    'nominal' => $nominal,
                    'keterangan' => $keterangan !== '' ? $keterangan : null,
                    'oleh' => $oleh,
                    'nama_akun' => $oleh,
                    'scope' => 'dalam_projek',
                    'bulan' => $period['bulan'],
                    'tahun' => $period['tahun'],
                    'item_index' => $itemIndex,
                ],
                $creator->id
            );
        }
    }

    public function notifyDashboardBiayaLunas(DashboardBiaya $row, ?User $approver = null): void
    {
        $recipient = $row->created_by
            ? User::query()->find($row->created_by)
            : null;

        if (! $recipient) {
            \Illuminate\Support\Facades\Log::warning('WA lunas dashboard: creator tidak ditemukan.', [
                'dashboard_biaya_id' => $row->id,
                'created_by' => $row->created_by,
            ]);

            return;
        }

        $approver = $approver ?? auth()->user();
        $approverName = trim((string) ($approver?->name ?? 'Super Admin')) ?: 'Super Admin';
        $kategoriLabel = self::KATEGORI_LABELS[$row->kategori] ?? ucfirst((string) $row->kategori);
        $keterangan = trim((string) ($row->keterangan ?? ''));
        $message = $this->formatBiayaLunasMessage(
            $kategoriLabel,
            (float) $row->nominal,
            $keterangan,
            $approverName
        );

        $this->notifyRecipient(
            $recipient,
            'biaya_dilunasi',
            'Pembayaran biaya dilunasi',
            $message,
            [
                'dashboard_biaya_id' => $row->id,
                'kategori' => $row->kategori,
                'nominal' => (float) $row->nominal,
                'keterangan' => $keterangan !== '' ? $keterangan : null,
                'scope' => 'diluar_projek',
                'approved_by' => $approver?->id,
                'approved_by_nama' => $approverName,
            ]
        );
    }

    /**
     * @param  array<string, mixed>  $item
     */
    public function notifyProjectBiayaItemLunas(
        ProjekKerja $projek,
        string $kategori,
        array $item,
        int $itemIndex,
        ?User $approver = null
    ): void {
        $oleh = trim((string) ($item['oleh'] ?? ''));
        $recipient = $this->resolveUserByName($oleh);
        if (! $recipient) {
            \Illuminate\Support\Facades\Log::warning('WA lunas proyek: user tidak ditemukan dari nama oleh.', [
                'projek_kerja_id' => $projek->id,
                'oleh' => $oleh,
                'kategori' => $kategori,
                'item_index' => $itemIndex,
            ]);

            return;
        }

        $approver = $approver ?? auth()->user();
        $approverName = trim((string) ($approver?->name ?? 'Super Admin')) ?: 'Super Admin';
        $kategoriLabel = self::KATEGORI_LABELS[$kategori] ?? ucfirst($kategori);
        $keterangan = trim((string) ($item['keterangan'] ?? ''));
        $reportNo = trim((string) ($projek->report_no ?? '')) ?: ('Proyek #'.$projek->id);

        $message = $this->formatBiayaLunasMessage(
            $kategoriLabel,
            (float) ($item['nominal'] ?? 0),
            $keterangan,
            $approverName,
            $reportNo,
            $projek->jenis_pekerjaan
        );

        $this->notifyRecipient(
            $recipient,
            'biaya_dilunasi',
            'Pembayaran biaya dilunasi',
            $message,
            [
                'projek_kerja_id' => $projek->id,
                'report_no' => $projek->report_no,
                'divisi' => $projek->divisi,
                'kategori' => $kategori,
                'nominal' => (float) ($item['nominal'] ?? 0),
                'keterangan' => $keterangan !== '' ? $keterangan : null,
                'oleh' => $oleh,
                'scope' => 'dalam_projek',
                'item_index' => $itemIndex,
                'approved_by' => $approver?->id,
                'approved_by_nama' => $approverName,
            ]
        );
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function notifySuperAdmins(
        string $type,
        string $title,
        string $message,
        array $data,
        ?int $excludeUserId = null
    ): void {
        $superAdmins = User::query()
            ->whereRaw(
                "REPLACE(REPLACE(LOWER(COALESCE(TRIM(role), '')), ' ', '_'), '-', '_') = ?",
                ['super_admin']
            )
            ->when($excludeUserId, fn ($q) => $q->where('id', '!=', $excludeUserId))
            ->get(['id']);

        foreach ($superAdmins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data,
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function notifyRecipient(
        User $recipient,
        string $type,
        string $title,
        string $message,
        array $data
    ): void {
        Notification::create([
            'user_id' => $recipient->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        $this->whatsAppService->notifyLunasToUser(
            $recipient,
            "*{$title}*\n{$message}"
        );
    }

    protected function resolveUserByName(string $name): ?User
    {
        $name = trim($name);
        if ($name === '') {
            return null;
        }

        return User::query()
            ->whereRaw('LOWER(TRIM(COALESCE(name, \'\'))) = ?', [strtolower($name)])
            ->orderByDesc('id')
            ->first();
    }

    /**
     * @return array{bulan: int, tahun: int}
     */
    protected function periodFromDate(mixed $date): array
    {
        try {
            $dt = $date ? Carbon::parse($date) : now();
        } catch (\Throwable $e) {
            $dt = now();
        }

        return [
            'bulan' => (int) $dt->month,
            'tahun' => (int) $dt->year,
        ];
    }

    /**
     * @param  array<string, mixed>  $change
     */
    protected function findProjectItemIndex(ProjekKerja $projek, string $kategori, array $change): ?int
    {
        $fieldMap = [
            'jalan' => 'biaya_jalan_items',
            'pengeluaran' => 'biaya_pengeluaran_items',
            'reimbursment' => 'biaya_reimbursment_items',
        ];
        $field = $fieldMap[$kategori] ?? null;
        if (! $field) {
            return null;
        }

        $items = is_array($projek->{$field}) ? $projek->{$field} : [];
        $targetNominal = round((float) ($change['nominal'] ?? 0), 2);
        $targetOleh = trim((string) ($change['oleh'] ?? ''));
        $targetCreatedAt = trim((string) ($change['created_at'] ?? ''));

        $lastMatch = null;
        foreach ($items as $idx => $item) {
            if (! is_array($item)) {
                continue;
            }

            $nominal = round((float) ($item['nominal'] ?? 0), 2);
            if (abs($nominal - $targetNominal) > 0.009) {
                continue;
            }

            $oleh = trim((string) ($item['oleh'] ?? ''));
            if ($targetOleh !== '' && strcasecmp($oleh, $targetOleh) !== 0) {
                continue;
            }

            $createdAt = trim((string) ($item['created_at'] ?? ''));
            if ($targetCreatedAt !== '' && $createdAt !== $targetCreatedAt) {
                continue;
            }

            $lastMatch = (int) $idx;
        }

        return $lastMatch;
    }

    protected function formatNominal(float $nominal): string
    {
        return 'Rp '.number_format($nominal, 0, ',', '.');
    }

    protected function formatBiayaAddedMessage(
        string $actorName,
        string $kategoriLabel,
        float $nominal,
        string $keterangan,
        ?string $projekReportNo = null,
        ?string $projekNama = null
    ): string {
        $message = sprintf(
            '%s telah menambahkan %s sebesar %s',
            $actorName,
            $kategoriLabel,
            $this->formatNominal($nominal)
        );

        $reportNo = trim((string) $projekReportNo);
        if ($reportNo !== '') {
            $projekPart = "pada proyek {$reportNo}";
            $nama = trim((string) $projekNama);
            if ($nama !== '') {
                $projekPart .= " ({$nama})";
            }
            $message .= ' '.$projekPart;
        }

        $keterangan = trim($keterangan);
        $keteranganText = $keterangan !== '' ? $keterangan : '-';
        $message .= " dengan keterangan : {$keteranganText}";

        return $message;
    }

    protected function formatBiayaLunasMessage(
        string $kategoriLabel,
        float $nominal,
        string $keterangan,
        string $approverName,
        ?string $projekReportNo = null,
        ?string $projekNama = null
    ): string {
        $message = sprintf(
            '%s sebesar %s',
            $kategoriLabel,
            $this->formatNominal($nominal)
        );

        $reportNo = trim((string) $projekReportNo);
        if ($reportNo !== '') {
            $projekPart = "pada proyek {$reportNo}";
            $nama = trim((string) $projekNama);
            if ($nama !== '') {
                $projekPart .= " ({$nama})";
            }
            $message .= ' '.$projekPart;
        }

        $keterangan = trim($keterangan);
        $keteranganText = $keterangan !== '' ? $keterangan : '-';
        $message .= " dengan keterangan : {$keteranganText}";
        $message .= " telah dilunasi oleh {$approverName}.";

        return $message;
    }
}
