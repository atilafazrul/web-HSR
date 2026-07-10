<?php

namespace App\Services;

use App\Models\CutiRequest;
use App\Models\Notification;
use App\Models\User;
use Carbon\Carbon;

class CutiNotificationService
{
    public function __construct(
        private readonly WhatsAppService $whatsAppService,
    ) {}

    public function notifyNewSubmission(CutiRequest $cuti): void
    {
        $cuti->loadMissing('user');

        $pengaju = trim((string) ($cuti->nama_pengaju ?? $cuti->user?->name ?? 'Pengguna'));
        $divisi = trim((string) ($cuti->divisi_pengaju ?? $cuti->user?->divisi ?? ''));
        $divisiPart = $divisi !== '' ? " (divisi {$divisi})" : '';

        $message = sprintf(
            '%s — %s, %s (%d hari)%s',
            $pengaju,
            $cuti->jenis_cuti,
            $this->formatPeriode($cuti),
            (int) $cuti->jumlah_hari,
            $divisiPart
        );

        $this->notifySuperAdmins(
            'cuti_pengajuan_baru',
            'Pengajuan cuti baru',
            $message,
            [
                'cuti_request_id' => $cuti->id,
                'user_id' => $cuti->user_id,
                'nama_pengaju' => $pengaju,
                'jenis_cuti' => $cuti->jenis_cuti,
                'tanggal_mulai' => optional($cuti->tanggal_mulai)->format('Y-m-d'),
                'tanggal_selesai' => optional($cuti->tanggal_selesai)->format('Y-m-d'),
                'jumlah_hari' => (int) $cuti->jumlah_hari,
                'divisi' => $divisi,
                'status' => $cuti->status,
            ],
            $cuti->user_id
        );

        $this->whatsAppService->notifyCuti('Pengajuan cuti baru', $message);
    }

    public function notifyApproved(CutiRequest $cuti, ?User $approver = null): void
    {
        $cuti->loadMissing('user');

        $approverName = trim((string) ($cuti->approved_by_nama ?? $approver?->name ?? 'Super Admin'));
        $message = sprintf(
            '%s — %s (%d hari) — disetujui oleh %s',
            $cuti->jenis_cuti,
            $this->formatPeriode($cuti),
            (int) $cuti->jumlah_hari,
            $approverName
        );

        $this->notifyUser(
            (int) $cuti->user_id,
            'cuti_disetujui',
            'Pengajuan cuti disetujui',
            $message,
            [
                'cuti_request_id' => $cuti->id,
                'jenis_cuti' => $cuti->jenis_cuti,
                'tanggal_mulai' => optional($cuti->tanggal_mulai)->format('Y-m-d'),
                'tanggal_selesai' => optional($cuti->tanggal_selesai)->format('Y-m-d'),
                'jumlah_hari' => (int) $cuti->jumlah_hari,
                'status' => 'approved',
                'approved_by' => $cuti->approved_by,
                'approved_by_nama' => $approverName,
            ]
        );

        $this->whatsAppService->notifyCutiToUser(
            $cuti->user,
            "*Pengajuan cuti disetujui*\n{$message}"
        );
    }

    public function notifyRejected(CutiRequest $cuti, ?User $approver = null): void
    {
        $cuti->loadMissing('user');

        $approverName = trim((string) ($cuti->approved_by_nama ?? $approver?->name ?? 'Super Admin'));
        $alasan = trim((string) ($cuti->alasan_penolakan ?? ''));
        $alasanPart = $alasan !== '' ? " — {$alasan}" : '';

        $message = sprintf(
            '%s — %s (%d hari) — ditolak oleh %s%s',
            $cuti->jenis_cuti,
            $this->formatPeriode($cuti),
            (int) $cuti->jumlah_hari,
            $approverName,
            $alasanPart
        );

        $this->notifyUser(
            (int) $cuti->user_id,
            'cuti_ditolak',
            'Pengajuan cuti ditolak',
            $message,
            [
                'cuti_request_id' => $cuti->id,
                'jenis_cuti' => $cuti->jenis_cuti,
                'tanggal_mulai' => optional($cuti->tanggal_mulai)->format('Y-m-d'),
                'tanggal_selesai' => optional($cuti->tanggal_selesai)->format('Y-m-d'),
                'jumlah_hari' => (int) $cuti->jumlah_hari,
                'status' => 'rejected',
                'alasan_penolakan' => $alasan !== '' ? $alasan : null,
                'approved_by' => $cuti->approved_by,
                'approved_by_nama' => $approverName,
            ]
        );

        $this->whatsAppService->notifyCutiToUser(
            $cuti->user,
            "*Pengajuan cuti ditolak*\n{$message}"
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
    protected function notifyUser(int $userId, string $type, string $title, string $message, array $data): void
    {
        if ($userId <= 0) {
            return;
        }

        Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }

    protected function formatPeriode(CutiRequest $cuti): string
    {
        try {
            $start = $cuti->tanggal_mulai ? Carbon::parse($cuti->tanggal_mulai) : null;
            $end = $cuti->tanggal_selesai ? Carbon::parse($cuti->tanggal_selesai) : null;
        } catch (\Throwable $e) {
            return '-';
        }

        if (!$start || !$end) {
            return '-';
        }

        $startLabel = $start->format('d M Y');
        $endLabel = $end->format('d M Y');

        if ($start->isSameDay($end)) {
            return $startLabel;
        }

        return "{$startLabel} – {$endLabel}";
    }
}
