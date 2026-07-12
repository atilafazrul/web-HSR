<?php

namespace App\Http\Controllers;

use App\Models\DashboardBiaya;
use App\Models\ProjekKerja;
use App\Models\User;
use App\Services\BiayaNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class DashboardBiayaController extends Controller
{
    /**
     * @param  array<int, mixed>  $paths
     * @return array<int, string>
     */
    protected function toPublicPhotoUrls(array $paths): array
    {
        return collect($paths)
            ->map(fn ($p) => trim((string) $p))
            ->filter()
            ->map(fn ($p) => asset('storage/' . ltrim($p, '/')))
            ->values()
            ->all();
    }

    protected function isProjectItemInPeriod(array $item, $projectCreatedAt, int $bulan, int $tahun): bool
    {
        $rawDate = $item['created_at'] ?? $projectCreatedAt;
        if (empty($rawDate)) {
            return false;
        }

        try {
            $dt = Carbon::parse($rawDate);
        } catch (\Throwable $e) {
            return false;
        }

        return ((int) $dt->month === $bulan) && ((int) $dt->year === $tahun);
    }

    /** Kategori yang boleh melampirkan foto */
    protected function kategoriAllowsPhotos(?string $kategori): bool
    {
        return in_array($kategori, ['jalan', 'pengeluaran', 'reimbursment'], true);
    }

    protected function scopedQuery(Request $request)
    {
        $user = $request->user();
        $query = DashboardBiaya::query();

        if (($user->role ?? null) !== 'super_admin') {
            // Non-superadmin: hanya boleh melihat/mengubah biaya milik akunnya sendiri.
            $query->where('created_by', $user->id);
        } elseif ($request->filled('user_id')) {
            $query->where('created_by', (int) $request->input('user_id'));
        } elseif ($request->filled('divisi')) {
            $query->where('divisi', $request->input('divisi'));
        }

        return $query;
    }

    /**
     * @param  array<int, string|null>  $paths
     */
    protected function deleteStoredPhotos(array $paths): void
    {
        foreach ($paths as $p) {
            if ($p && Storage::disk('public')->exists($p)) {
                Storage::disk('public')->delete($p);
            }
        }
    }

    /**
     * @return array<int, string>
     */
    protected function storeUploadedPhotos(Request $request, string $key): array
    {
        $stored = [];
        if (! $request->hasFile($key)) {
            return $stored;
        }
        $files = $request->file($key);
        if (! is_array($files)) {
            $files = [$files];
        }
        foreach ($files as $file) {
            if ($file && $file->isValid()) {
                $stored[] = $file->store('dashboard-biaya-photos', 'public');
            }
        }

        return $stored;
    }

    public function index(Request $request)
    {
        $items = $this->scopedQuery($request)
            ->with(['creator:id,name', 'updater:id,name'])
            ->orderByRaw('is_lunas ASC')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($row) {
                $row->creator_name = $row->creator?->name;
                $row->updater_name = $row->updater?->name;
                return $row;
            });

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    public function summary(Request $request)
    {
        $rows = $this->scopedQuery($request)->get();
        $sumBy = fn (string $kategori) => (float) $rows->where('kategori', $kategori)->sum('nominal');
        $sumLunasBy = fn (string $kategori) => (float) $rows->where('kategori', $kategori)->where('is_lunas', true)->sum('nominal');

        $jalan = $sumBy('jalan');
        $pengeluaran = $sumBy('pengeluaran');
        $reimbursment = $sumBy('reimbursment');

        return response()->json([
            'success' => true,
            'data' => [
                'jalan' => $jalan,
                'pengeluaran' => $pengeluaran,
                'reimbursment' => $reimbursment,
                'total' => $jalan + $pengeluaran + $reimbursment,
                'lunas' => [
                    'jalan' => $sumLunasBy('jalan'),
                    'pengeluaran' => $sumLunasBy('pengeluaran'),
                    'reimbursment' => $sumLunasBy('reimbursment'),
                    'total' => (float) $rows->where('is_lunas', true)->sum('nominal'),
                ],
            ],
        ]);
    }

    /**
     * Ringkasan biaya dashboard (di luar projek) per divisi.
     */
    public function summaryPerDivisi(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = ($user->role ?? null) === 'super_admin';
        $role = $user->role ?? null;

        if (! in_array($role, ['super_admin', 'admin', 'user'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Role tidak diizinkan mengakses ringkasan biaya per divisi.',
            ], 403);
        }

        $query = DashboardBiaya::query();

        if (! $isSuperAdmin) {
            if ($role === 'admin' && ! empty($user->divisi)) {
                $query->where('divisi', $user->divisi);
            } else {
                $query->where('created_by', $user->id);
            }
        }

        if ($request->filled('divisi')) {
            $divisi = trim((string) $request->input('divisi'));
            $query->whereRaw('LOWER(TRIM(divisi)) = ?', [strtolower($divisi)]);
        }

        $rows = $query->get();

        $byDivisi = $rows->groupBy(fn ($row) => trim((string) ($row->divisi ?: 'Tanpa Divisi')));

        $data = $byDivisi->map(function ($items, $divisi) {
            $sumBy = fn (string $kategori) => (float) $items->where('kategori', $kategori)->sum('nominal');
            $jalan = $sumBy('jalan');
            $pengeluaran = $sumBy('pengeluaran');
            $reimbursment = $sumBy('reimbursment');

            return [
                'divisi' => $divisi,
                'jalan' => $jalan,
                'pengeluaran' => $pengeluaran,
                'reimbursment' => $reimbursment,
                'total' => $jalan + $pengeluaran + $reimbursment,
            ];
        })->values()->sortBy('divisi')->values();

        return response()->json([
            'success' => true,
            'data' => [
                'by_divisi' => $data,
                'grand_total' => (float) $data->sum('total'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'kategori' => 'required|in:jalan,pengeluaran,reimbursment',
            'nominal' => 'required|numeric|min:0',
            'keterangan' => 'nullable|string|max:2000',
            'divisi' => 'nullable|string|max:100',
            'photos' => 'nullable|array|max:25',
            'photos.*' => 'image|mimes:jpeg,jpg,png,webp|max:5120',
            'photo' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        $hasAnyPhoto = $request->hasFile('photos') || $request->hasFile('photo');
        if ($hasAnyPhoto && ! $this->kategoriAllowsPhotos($request->input('kategori'))) {
            return response()->json([
                'success' => false,
                'message' => 'Foto hanya untuk kategori Pengeluaran dan Reimbursment.',
            ], 422);
        }

        $photoPaths = $this->storeUploadedPhotos($request, 'photos');
        if ($request->hasFile('photo')) {
            $photoPaths[] = $request->file('photo')->store('dashboard-biaya-photos', 'public');
        }

        $divisi = ($user->role ?? null) === 'super_admin'
            ? ($request->input('divisi') ?: $user->divisi)
            : $user->divisi;

        $row = DashboardBiaya::create([
            'divisi' => $divisi,
            'kategori' => $request->input('kategori'),
            'nominal' => $request->input('nominal'),
            'keterangan' => $request->input('keterangan'),
            'photo_paths' => $photoPaths === [] ? null : $photoPaths,
            'is_lunas' => false,
            'created_by' => $user->id ?? null,
            'updated_by' => $user->id ?? null,
        ]);

        app(BiayaNotificationService::class)->notifyDashboardBiaya($row, $user);

        return response()->json([
            'success' => true,
            'data' => tap($row->fresh(['creator:id,name', 'updater:id,name']), function ($fresh) {
                $fresh->creator_name = $fresh->creator?->name;
                $fresh->updater_name = $fresh->updater?->name;
            }),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = $request->user();
        $row = $this->scopedQuery($request)->findOrFail($id);

        $request->validate([
            'is_lunas' => 'nullable|boolean',
            'lunas_group_id' => 'nullable|string|max:64',
            'keterangan' => 'nullable|string|max:2000',
            'nominal' => 'nullable|numeric|min:0',
            'photos' => 'nullable|array|max:25',
            'photos.*' => 'image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        if ($request->has('is_lunas') && ($user->role ?? null) !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya superadmin yang bisa mengubah status lunas biaya dashboard.',
            ], 403);
        }

        $wantsKeteranganChange = $request->has('keterangan');
        $wantsLockedContentChange = $request->has('nominal') || $request->hasFile('photos');

        $pendingLunasOff = ($user->role ?? null) === 'super_admin'
            && $request->has('is_lunas')
            && ! $request->boolean('is_lunas');

        if ($row->is_lunas && $wantsLockedContentChange && ! $pendingLunasOff) {
            return response()->json([
                'success' => false,
                'message' => 'Biaya sudah lunas: nominal/foto tidak bisa diubah.',
            ], 403);
        }

        // Keterangan tetap boleh diubah meskipun sudah lunas (untuk koreksi/admin note).
        if ($row->is_lunas && $wantsKeteranganChange && ! $pendingLunasOff) {
            // no-op: explicitly allowed
        }

        $payload = ['updated_by' => $user->id ?? null];
        if ($request->has('keterangan')) {
            $payload['keterangan'] = $request->input('keterangan');
        }
        if ($request->has('nominal')) {
            $payload['nominal'] = $request->input('nominal');
        }
        if ($request->hasFile('photos')) {
            if (! $this->kategoriAllowsPhotos($row->kategori)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Foto hanya untuk kategori Pengeluaran dan Reimbursment.',
                ], 422);
            }
            $newPaths = $this->storeUploadedPhotos($request, 'photos');
            if ($newPaths !== []) {
                $existing = $row->photo_paths ?? [];
                $payload['photo_paths'] = array_values(array_merge($existing, $newPaths));
            }
        }
        if ($request->has('is_lunas')) {
            $isLunas = (bool) $request->boolean('is_lunas');
            $payload['is_lunas'] = $isLunas;
            $payload['lunas_at'] = $isLunas ? now() : null;
            if ($isLunas && $request->filled('lunas_group_id')) {
                $payload['lunas_group_id'] = (string) $request->input('lunas_group_id');
            } elseif (! $isLunas) {
                $payload['lunas_group_id'] = null;
            }
        }

        $wasLunas = (bool) $row->is_lunas;
        $row->update($payload);
        $fresh = $row->fresh(['creator:id,name,no_telepon', 'updater:id,name']);

        if (
            $request->has('is_lunas')
            && (bool) $request->boolean('is_lunas')
            && ! $wasLunas
            && ($user->role ?? null) === 'super_admin'
        ) {
            app(BiayaNotificationService::class)->notifyDashboardBiayaLunas($fresh, $user);
        }

        return response()->json([
            'success' => true,
            'data' => tap($fresh, function ($row) {
                $row->creator_name = $row->creator?->name;
                $row->updater_name = $row->updater?->name;
            }),
        ]);
    }

    public function rekapPerAkun(Request $request)
    {
        $user = $request->user();

        $isSuperAdmin = ($user->role ?? null) === 'super_admin';

        if (!in_array(($user->role ?? null), ['super_admin', 'admin', 'user'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Role tidak diizinkan mengakses rekapitulasi per akun.',
            ], 403);
        }

        $bulan = (int) $request->input('bulan');
        $tahun = (int) $request->input('tahun');

        if (!$bulan || !$tahun) {
            return response()->json([
                'success' => false,
                'message' => 'Bulan dan tahun wajib diisi.',
            ], 422);
        }

        // Ambil biaya dari dashboard_biayas
        $query = DashboardBiaya::query();
        $query->whereYear('created_at', $tahun)
              ->whereMonth('created_at', $bulan)
              ->whereNotNull('created_by'); // Hanya ambil data user yang masih ada

        // Non-superadmin hanya boleh melihat akun sendiri.
        if (!$isSuperAdmin) {
            $query->where('created_by', $user->id);
        }

        $dashboardBiayaByAkun = $query->with(['creator:id,name'])
            ->get()
            ->groupBy('created_by')
            ->map(function ($items) {
                $akun = $items->first()->creator;
                // Skip jika user sudah dihapus (creator = null)
                if (!$akun) {
                    return null;
                }
                return [
                    'nama_akun' => $akun->name ?? 'Unknown',
                    'created_by' => $items->first()->created_by,
                    'jalan' => $items->where('kategori', 'jalan')->sum('nominal'),
                    'pengeluaran' => $items->where('kategori', 'pengeluaran')->sum('nominal'),
                    'reimbursment' => $items->where('kategori', 'reimbursment')->sum('nominal'),
                    'total' => $items->sum('nominal'),
                ];
            })->filter(); // Hapus nilai null

        // Ambil biaya dari projek_kerjas
        $projekKerjas = \App\Models\ProjekKerja::get([
            'created_at',
            'biaya_jalan_items',
            'biaya_pengeluaran_items',
            'biaya_reimbursment_items',
        ]);

        // Ambil semua user yang masih aktif untuk validasi
        $activeUserNames = \App\Models\User::pluck('name')
            ->map(fn ($name) => strtolower(trim($name)))
            ->flip(); // Untuk O(1) lookup

        $projekBiayaByAkun = collect();

        foreach ($projekKerjas as $projek) {
            // Proses biaya jalan
            $jalanItems = $projek->biaya_jalan_items ?? [];
            foreach ($jalanItems as $item) {
                $oleh = trim($item['oleh'] ?? '');
                $nominal = (float) ($item['nominal'] ?? 0);
                if (! $this->isProjectItemInPeriod((array) $item, $projek->created_at, $bulan, $tahun)) {
                    continue;
                }

                if (!$isSuperAdmin && strtolower($oleh) !== strtolower(trim((string) $user->name))) {
                    continue;
                }

                // Skip jika user sudah dihapus (nama tidak ada di activeUserNames)
                if ($nominal > 0 && $oleh !== '' && $activeUserNames->has(strtolower($oleh))) {
                    // Gunakan lowercase key untuk case-insensitive grouping
                    $lowerOleh = strtolower($oleh);
                    $existing = $projekBiayaByAkun->get($lowerOleh);
                    if ($existing) {
                        $existing['jalan'] += $nominal;
                        $existing['total'] += $nominal;
                        $projekBiayaByAkun->put($lowerOleh, $existing);
                    } else {
                        $projekBiayaByAkun->put($lowerOleh, [
                            'nama_akun' => $oleh, // Tetap simpan nama asli
                            'jalan' => $nominal,
                            'pengeluaran' => 0,
                            'reimbursment' => 0,
                            'total' => $nominal,
                        ]);
                    }
                }
            }

            // Proses biaya pengeluaran
            $pengeluaranItems = $projek->biaya_pengeluaran_items ?? [];
            foreach ($pengeluaranItems as $item) {
                $oleh = trim($item['oleh'] ?? '');
                $nominal = (float) ($item['nominal'] ?? 0);
                if (! $this->isProjectItemInPeriod((array) $item, $projek->created_at, $bulan, $tahun)) {
                    continue;
                }

                if (!$isSuperAdmin && strtolower($oleh) !== strtolower(trim((string) $user->name))) {
                    continue;
                }

                if ($nominal > 0 && $oleh !== '' && $activeUserNames->has(strtolower($oleh))) {
                    $lowerOleh = strtolower($oleh);
                    $existing = $projekBiayaByAkun->get($lowerOleh);
                    if ($existing) {
                        $existing['pengeluaran'] += $nominal;
                        $existing['total'] += $nominal;
                        $projekBiayaByAkun->put($lowerOleh, $existing);
                    } else {
                        $projekBiayaByAkun->put($lowerOleh, [
                            'nama_akun' => $oleh, // Tetap simpan nama asli
                            'jalan' => 0,
                            'pengeluaran' => $nominal,
                            'reimbursment' => 0,
                            'total' => $nominal,
                        ]);
                    }
                }
            }

            // Proses biaya reimbursment
            $reimbursmentItems = $projek->biaya_reimbursment_items ?? [];
            foreach ($reimbursmentItems as $item) {
                $oleh = trim($item['oleh'] ?? '');
                $nominal = (float) ($item['nominal'] ?? 0);
                if (! $this->isProjectItemInPeriod((array) $item, $projek->created_at, $bulan, $tahun)) {
                    continue;
                }

                if (!$isSuperAdmin && strtolower($oleh) !== strtolower(trim((string) $user->name))) {
                    continue;
                }

                if ($nominal > 0 && $oleh !== '' && $activeUserNames->has(strtolower($oleh))) {
                    $lowerOleh = strtolower($oleh);
                    $existing = $projekBiayaByAkun->get($lowerOleh);
                    if ($existing) {
                        $existing['reimbursment'] += $nominal;
                        $existing['total'] += $nominal;
                        $projekBiayaByAkun->put($lowerOleh, $existing);
                    } else {
                        $projekBiayaByAkun->put($lowerOleh, [
                            'nama_akun' => $oleh, // Tetap simpan nama asli
                            'jalan' => 0,
                            'pengeluaran' => 0,
                            'reimbursment' => $nominal,
                            'total' => $nominal,
                        ]);
                    }
                }
            }
        }

        // Gabungkan data dari dashboard_biayas dan projek_kerjas
        $dataByAkun = collect();

        // Tambah data dari dashboard_biayas (gunakan lowercase key untuk case-insensitive grouping)
        foreach ($dashboardBiayaByAkun as $userId => $data) {
            $namaAkun = $data['nama_akun'];
            $lowerNama = strtolower($namaAkun); // Gunakan lowercase untuk grouping
            $existing = $dataByAkun->get($lowerNama);
            if ($existing) {
                $existing['jalan'] += $data['jalan'];
                $existing['pengeluaran'] += $data['pengeluaran'];
                $existing['reimbursment'] += $data['reimbursment'];
                $existing['total'] += $data['total'];
                // Keep created_by if it exists
                if (!$existing['created_by']) {
                    $existing['created_by'] = $data['created_by'] ?? null;
                }
                $dataByAkun->put($lowerNama, $existing);
            } else {
                $dataByAkun->put($lowerNama, [
                    'nama_akun' => $namaAkun, // Tetap simpan nama asli
                    'created_by' => $data['created_by'] ?? null,
                    'jalan' => $data['jalan'],
                    'pengeluaran' => $data['pengeluaran'],
                    'reimbursment' => $data['reimbursment'],
                    'total' => $data['total'],
                ]);
            }
        }

        // Tambah data dari projek_kerjas (sudah menggunakan lowercase key)
        foreach ($projekBiayaByAkun as $lowerNama => $data) {
            $existing = $dataByAkun->get($lowerNama);
            if ($existing) {
                $existing['jalan'] += $data['jalan'];
                $existing['pengeluaran'] += $data['pengeluaran'];
                $existing['reimbursment'] += $data['reimbursment'];
                $existing['total'] += $data['total'];
                $dataByAkun->put($lowerNama, $existing);
            } else {
                $dataByAkun->put($lowerNama, [
                    'nama_akun' => $data['nama_akun'], // Tetap simpan nama asli
                    'jalan' => $data['jalan'],
                    'pengeluaran' => $data['pengeluaran'],
                    'reimbursment' => $data['reimbursment'],
                    'total' => $data['total'],
                ]);
            }
        }

        // Sort by nama akun
        $dataByAkun = $dataByAkun->values()->sortBy('nama_akun')->values();

        // Calculate total semua
        $allBiaya = [
            'jalan' => $dataByAkun->sum('jalan'),
            'pengeluaran' => $dataByAkun->sum('pengeluaran'),
            'reimbursment' => $dataByAkun->sum('reimbursment'),
            'total' => $dataByAkun->sum('total'),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'by_akun' => $dataByAkun,
                'all' => $allBiaya,
            ]
        ]);
    }

    public function searchAkun(Request $request)
    {
        $user = $request->user();

        if (($user->role ?? null) !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya superadmin yang bisa mengakses rekapitulasi per akun.',
            ], 403);
        }

        $nama = $request->input('nama');
        $bulan = (int) $request->input('bulan');
        $tahun = (int) $request->input('tahun');

        if (!$nama) {
            return response()->json([
                'success' => false,
                'message' => 'Nama akun wajib diisi.',
            ], 422);
        }

        $users = collect();

        // Ambil semua user yang masih aktif untuk validasi
        $activeUserNames = \App\Models\User::pluck('name')
            ->map(fn ($name) => strtolower(trim($name)))
            ->flip(); // Untuk O(1) lookup

        // Jika bulan dan tahun disediakan, hanya cari user yang memiliki biaya di periode tersebut
        if ($bulan && $tahun) {
            // Cari user dengan nama yang cocok DAN memiliki biaya di dashboard_biayas
            $usersFromDashboard = \App\Models\User::where('name', 'LIKE', "%{$nama}%")
                ->whereHas('dashboardBiaya', function ($q) use ($bulan, $tahun) {
                    $q->whereYear('created_at', $tahun)
                      ->whereMonth('created_at', $bulan);
                })
                ->orderBy('name', 'asc')
                ->limit(10)
                ->get()
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'nama_akun' => $u->name,
                        'name' => $u->name,
                        'source' => 'dashboard',
                    ];
                });
            $users = $users->concat($usersFromDashboard);

            // Cari user dari projek_kerjas yang memiliki biaya di periode ini
            $projekKerjas = \App\Models\ProjekKerja::get([
                'created_at',
                'biaya_jalan_items',
                'biaya_pengeluaran_items',
                'biaya_reimbursment_items',
            ]);

            $olehNames = collect();
            foreach ($projekKerjas as $projek) {
                $items = array_merge(
                    $projek->biaya_jalan_items ?? [],
                    $projek->biaya_pengeluaran_items ?? [],
                    $projek->biaya_reimbursment_items ?? []
                );
                foreach ($items as $item) {
                    $oleh = trim($item['oleh'] ?? '');
                    if (! $this->isProjectItemInPeriod((array) $item, $projek->created_at, $bulan, $tahun)) {
                        continue;
                    }
                    // Skip jika user sudah dihapus atau tidak cocok dengan pencarian
                    if ($oleh !== '' && stripos($oleh, $nama) !== false && $activeUserNames->has(strtolower($oleh))) {
                        $olehNames->push([
                            'id' => 0,
                            'nama_akun' => $oleh,
                            'name' => $oleh,
                            'source' => 'projek',
                        ]);
                    }
                }
            }
            $users = $users->concat($olehNames->unique('nama_akun'));
        } else {
            // Tanpa filter bulan/tahun, cari semua user dengan nama yang cocok
            $usersFromDashboard = \App\Models\User::where('name', 'LIKE', "%{$nama}%")
                ->orderBy('name', 'asc')
                ->limit(10)
                ->get()
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'nama_akun' => $u->name,
                        'name' => $u->name,
                        'source' => 'dashboard',
                    ];
                });
            $users = $users->concat($usersFromDashboard);
        }

        // Sort dan limit
        $users = $users->unique('nama_akun')->sortBy('nama_akun')->take(10)->values();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function rekapDetailAkun(Request $request)
    {
        $user = $request->user();
        $isSuperAdmin = ($user->role ?? null) === 'super_admin';

        if (!in_array(($user->role ?? null), ['super_admin', 'admin', 'user'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Role tidak diizinkan mengakses detail rekapitulasi per akun.',
            ], 403);
        }

        $bulan = (int) $request->input('bulan');
        $tahun = (int) $request->input('tahun');
        $createdBy = $request->input('created_by');
        $namaAkun = trim((string) $request->input('nama_akun', ''));

        if (!$bulan || !$tahun) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter tidak lengkap.',
            ], 422);
        }

        $data = collect();

        // Ambil biaya dari dashboard_biayas
        $query = DashboardBiaya::query();
        $query->whereYear('created_at', $tahun)
              ->whereMonth('created_at', $bulan)
              ->whereNotNull('created_by'); // Hanya ambil data user yang masih ada

        // Non-superadmin wajib hanya ke akun sendiri.
        $targetUserId = $isSuperAdmin ? $createdBy : $user->id;
        if ($isSuperAdmin && $namaAkun !== '' && !$targetUserId) {
            $targetUser = \App\Models\User::whereRaw('LOWER(TRIM(name)) = ?', [strtolower($namaAkun)])->first(['id']);
            if ($targetUser) {
                $targetUserId = $targetUser->id;
            }
        }

        // Filter by user id
        if ($targetUserId) {
            $query->where('created_by', $targetUserId);
        }

        $dashboardBiaya = $query->with(['creator:id,name', 'updater:id,name'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->filter(fn ($row) => $row->creator !== null) // Skip jika user sudah dihapus
            ->map(function ($row) {
                $row->source = 'dashboard';
                return $row;
            });

        $data = $data->concat($dashboardBiaya);

        // Gunakan nama_akun untuk filter project, atau ambil dari dashboard jika ada created_by
        $filterNamaAkun = $isSuperAdmin ? $namaAkun : trim((string) $user->name);
        if (!$filterNamaAkun && $dashboardBiaya->isNotEmpty()) {
            $firstItem = $dashboardBiaya->first();
            if ($firstItem && $firstItem->creator) {
                $filterNamaAkun = trim((string) $firstItem->creator->name);
            }
        }

        // Ambil semua user yang masih aktif untuk validasi
        $activeUserNames = \App\Models\User::pluck('name')
            ->map(fn ($name) => strtolower(trim($name)))
            ->flip(); // Untuk O(1) lookup

        // Ambil biaya dari projek_kerjas
        $projekKerjas = \App\Models\ProjekKerja::get([
            'id',
            'biaya_jalan_items',
            'biaya_pengeluaran_items',
            'biaya_reimbursment_items',
            'created_at',
            'updated_at',
        ]);

        foreach ($projekKerjas as $projek) {
            // Proses biaya jalan
            $jalanItems = $projek->biaya_jalan_items ?? [];
            foreach ($jalanItems as $idx => $item) {
                $oleh = trim((string) ($item['oleh'] ?? ''));
                $nominal = (float) ($item['nominal'] ?? 0);
                if (! $this->isProjectItemInPeriod((array) $item, $projek->created_at, $bulan, $tahun)) {
                    continue;
                }

                // Filter oleh nama jika nama_akun disediakan (case-insensitive exact match)
                $shouldInclude = false;
                if ($filterNamaAkun !== '' && strtolower($oleh) === strtolower(trim((string) $filterNamaAkun))) {
                    $shouldInclude = true;
                }

                // Skip jika user sudah dihapus (nama tidak ada di activeUserNames)
                if ($shouldInclude && $nominal > 0 && $oleh !== '' && $activeUserNames->has(strtolower($oleh))) {
                    $photoUrls = $this->toPublicPhotoUrls((array) ($item['photo_paths'] ?? []));
                    $data->push((object) [
                        'id' => 'projek_' . $projek->id . '_jalan_' . uniqid(),
                        'project_id' => $projek->id,
                        'item_index' => $idx,
                        'kategori' => 'jalan',
                        'nominal' => $nominal,
                        'keterangan' => $item['keterangan'] ?? '',
                        'is_lunas' => $item['is_lunas'] ?? false,
                        'lunas_group_id' => $item['lunas_group_id'] ?? null,
                        'lunas_at' => $item['lunas_at'] ?? null,
                        'oleh' => $oleh,
                        'created_at' => $item['created_at'] ?? $projek->created_at,
                        'updated_at' => $projek->updated_at,
                        'creator' => (object) ['id' => 0, 'name' => $oleh],
                        'updater' => null,
                        'photo_urls' => $photoUrls,
                        'source' => 'projek',
                    ]);
                }
            }

            // Proses biaya pengeluaran
            $pengeluaranItems = $projek->biaya_pengeluaran_items ?? [];
            foreach ($pengeluaranItems as $idx => $item) {
                $oleh = trim((string) ($item['oleh'] ?? ''));
                $nominal = (float) ($item['nominal'] ?? 0);
                if (! $this->isProjectItemInPeriod((array) $item, $projek->created_at, $bulan, $tahun)) {
                    continue;
                }

                $shouldInclude = false;
                if ($filterNamaAkun !== '' && strtolower($oleh) === strtolower(trim((string) $filterNamaAkun))) {
                    $shouldInclude = true;
                }

                // Skip jika user sudah dihapus (nama tidak ada di activeUserNames)
                if ($shouldInclude && $nominal > 0 && $oleh !== '' && $activeUserNames->has(strtolower($oleh))) {
                    $photoUrls = $this->toPublicPhotoUrls((array) ($item['photo_paths'] ?? []));
                    $data->push((object) [
                        'id' => 'projek_' . $projek->id . '_pengeluaran_' . uniqid(),
                        'project_id' => $projek->id,
                        'item_index' => $idx,
                        'kategori' => 'pengeluaran',
                        'nominal' => $nominal,
                        'keterangan' => $item['keterangan'] ?? '',
                        'is_lunas' => $item['is_lunas'] ?? false,
                        'lunas_group_id' => $item['lunas_group_id'] ?? null,
                        'lunas_at' => $item['lunas_at'] ?? null,
                        'oleh' => $oleh,
                        'created_at' => $item['created_at'] ?? $projek->created_at,
                        'updated_at' => $projek->updated_at,
                        'creator' => (object) ['id' => 0, 'name' => $oleh],
                        'updater' => null,
                        'photo_urls' => $photoUrls,
                        'source' => 'projek',
                    ]);
                }
            }

            // Proses biaya reimbursment
            $reimbursmentItems = $projek->biaya_reimbursment_items ?? [];
            foreach ($reimbursmentItems as $idx => $item) {
                $oleh = trim((string) ($item['oleh'] ?? ''));
                $nominal = (float) ($item['nominal'] ?? 0);
                if (! $this->isProjectItemInPeriod((array) $item, $projek->created_at, $bulan, $tahun)) {
                    continue;
                }

                $shouldInclude = false;
                if ($filterNamaAkun !== '' && strtolower($oleh) === strtolower(trim((string) $filterNamaAkun))) {
                    $shouldInclude = true;
                }

                // Skip jika user sudah dihapus (nama tidak ada di activeUserNames)
                if ($shouldInclude && $nominal > 0 && $oleh !== '' && $activeUserNames->has(strtolower($oleh))) {
                    $photoUrls = $this->toPublicPhotoUrls((array) ($item['photo_paths'] ?? []));
                    $data->push((object) [
                        'id' => 'projek_' . $projek->id . '_reimbursment_' . uniqid(),
                        'project_id' => $projek->id,
                        'item_index' => $idx,
                        'kategori' => 'reimbursment',
                        'nominal' => $nominal,
                        'keterangan' => $item['keterangan'] ?? '',
                        'is_lunas' => $item['is_lunas'] ?? false,
                        'lunas_group_id' => $item['lunas_group_id'] ?? null,
                        'lunas_at' => $item['lunas_at'] ?? null,
                        'oleh' => $oleh,
                        'created_at' => $item['created_at'] ?? $projek->created_at,
                        'updated_at' => $projek->updated_at,
                        'creator' => (object) ['id' => 0, 'name' => $oleh],
                        'updater' => null,
                        'photo_urls' => $photoUrls,
                        'source' => 'projek',
                    ]);
                }
            }
        }

        // Sort by created_at descending
        $data = $data->sortByDesc('created_at')->values();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    protected function kasTemplatePath(): string
    {
        return storage_path('app/templates/kas-hsr-template.xlsx');
    }

    /**
     * @return array<int, string>
     */
    protected function kasMonthNames(): array
    {
        return [
            1 => 'JANUARI',
            2 => 'FEBRUARI',
            3 => 'MARET',
            4 => 'APRIL',
            5 => 'MEI',
            6 => 'JUNI',
            7 => 'JULI',
            8 => 'AGUSTUS',
            9 => 'SEPTEMBER',
            10 => 'OKTOBER',
            11 => 'NOVEMBER',
            12 => 'DESEMBER',
        ];
    }

    /**
     * @return array<int, array{date: \Carbon\Carbon, keterangan: string, debit: float, kredit: float, staff: string}>
     */
    protected function collectKasTransactionLines(int $bulan, int $tahun, User $authUser, ?string $namaAkunFilter = null): array
    {
        $isSuperAdmin = ($authUser->role ?? null) === 'super_admin';
        $filterName = $namaAkunFilter !== null ? strtolower(trim($namaAkunFilter)) : '';
        $lines = [];

        $activeUserNames = User::query()
            ->pluck('name')
            ->map(fn ($name) => strtolower(trim((string) $name)))
            ->flip();

        // Dashboard biaya (di luar proyek)
        $dashboardQuery = DashboardBiaya::query()
            ->whereYear('created_at', $tahun)
            ->whereMonth('created_at', $bulan)
            ->whereNotNull('created_by')
            ->with('creator:id,name');

        if (! $isSuperAdmin) {
            $dashboardQuery->where('created_by', $authUser->id);
        } elseif ($filterName !== '') {
            $dashboardQuery->whereHas('creator', function ($q) use ($filterName) {
                $q->whereRaw('LOWER(TRIM(name)) = ?', [$filterName]);
            });
        }

        foreach ($dashboardQuery->orderBy('created_at')->get() as $row) {
            if (! $row->creator) {
                continue;
            }
            $staff = trim((string) $row->creator->name);
            $nominal = (float) $row->nominal;
            if ($nominal <= 0) {
                continue;
            }
            $keterangan = trim((string) ($row->keterangan ?? ''));
            if ($keterangan === '') {
                $keterangan = strtoupper((string) ($row->kategori ?? 'BIAYA'));
            }

            $lines[] = [
                'date' => Carbon::parse($row->created_at),
                'keterangan' => $keterangan,
                'debit' => 0.0,
                'kredit' => $nominal,
                'staff' => $staff,
            ];
        }

        // Biaya dari proyek kerja
        $projekKerjas = ProjekKerja::query()->get([
            'id',
            'biaya_jalan_items',
            'biaya_pengeluaran_items',
            'biaya_reimbursment_items',
            'created_at',
        ]);

        $kategoriLabels = [
            'jalan' => 'UANG JALAN',
            'pengeluaran' => 'BIAYA PENGELUARAN',
            'reimbursment' => 'BIAYA REIMBURSMENT',
        ];

        foreach ($projekKerjas as $projek) {
            foreach ($kategoriLabels as $kategori => $defaultLabel) {
                $items = $projek->{"biaya_{$kategori}_items"} ?? [];
                foreach ($items as $item) {
                    $oleh = trim((string) ($item['oleh'] ?? ''));
                    $nominal = (float) ($item['nominal'] ?? 0);
                    if (! $this->isProjectItemInPeriod((array) $item, $projek->created_at, $bulan, $tahun)) {
                        continue;
                    }
                    if ($nominal <= 0 || $oleh === '') {
                        continue;
                    }
                    if (! $activeUserNames->has(strtolower($oleh))) {
                        continue;
                    }
                    if (! $isSuperAdmin && strtolower($oleh) !== strtolower(trim((string) $authUser->name))) {
                        continue;
                    }
                    if ($filterName !== '' && strtolower($oleh) !== $filterName) {
                        continue;
                    }

                    $keterangan = trim((string) ($item['keterangan'] ?? ''));
                    if ($keterangan === '') {
                        $keterangan = $defaultLabel;
                    }

                    $rawDate = $item['created_at'] ?? $projek->created_at;
                    $lines[] = [
                        'date' => Carbon::parse($rawDate),
                        'keterangan' => $keterangan,
                        'debit' => 0.0,
                        'kredit' => $nominal,
                        'staff' => $oleh,
                    ];
                }
            }
        }

        usort($lines, function ($a, $b) {
            return $a['date']->timestamp <=> $b['date']->timestamp;
        });

        return $lines;
    }

    public function exportKas(Request $request)
    {
        $user = $request->user();

        if (! in_array(($user->role ?? null), ['super_admin', 'admin', 'user'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Role tidak diizinkan mengekspor rekapitulasi kas.',
            ], 403);
        }

        $bulan = (int) $request->input('bulan');
        $tahun = (int) $request->input('tahun');
        $namaAkun = trim((string) $request->input('nama_akun', ''));

        if (! $bulan || ! $tahun) {
            return response()->json([
                'success' => false,
                'message' => 'Bulan dan tahun wajib diisi.',
            ], 422);
        }

        if (! file_exists($this->kasTemplatePath())) {
            return response()->json([
                'success' => false,
                'message' => 'Template KAS HSR tidak ditemukan di server.',
            ], 500);
        }

        $lines = $this->collectKasTransactionLines(
            $bulan,
            $tahun,
            $user,
            $namaAkun !== '' ? $namaAkun : null
        );

        if (empty($lines)) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada data biaya untuk periode ini.',
            ], 422);
        }

        $monthNames = $this->kasMonthNames();
        $monthLabel = $monthNames[$bulan] ?? strtoupper(Carbon::create($tahun, $bulan, 1)->locale('id')->translatedFormat('F'));
        $title = 'KAS PT HSR '.$monthLabel.' '.$tahun;

        $styleTemplate = IOFactory::load($this->kasTemplatePath());
        $styleSheet = $styleTemplate->getActiveSheet();
        $dataRowStyle = $styleSheet->getStyle('A3:G3');
        $footerTotalStyle = $styleSheet->getStyle('A139:G139');
        $footerSisaStyle = $styleSheet->getStyle('A140:G140');

        $spreadsheet = IOFactory::load($this->kasTemplatePath());
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle(substr($monthLabel.' '.$tahun, 0, 31));
        $sheet->setCellValue('A1', $title);

        $dataStyleRow = 3;
        $highest = (int) $sheet->getHighestRow();
        if ($highest > 2) {
            $sheet->removeRow(3, $highest - 2);
        }

        $row = 3;
        $no = 1;
        $firstDataRow = 3;
        $rpMoneyFormat = '[$Rp-421]#,##0';
        $rpSaldoFormat = '"Rp"#,##0';

        foreach ($lines as $line) {
            if ($row > $dataStyleRow) {
                $sheet->insertNewRowBefore($row);
            }
            $sheet->duplicateStyle($dataRowStyle, "A{$row}:G{$row}");

            $debit = (float) ($line['debit'] ?? 0);
            $kredit = (float) ($line['kredit'] ?? 0);

            $sheet->setCellValue("A{$row}", $no);
            $sheet->setCellValue("B{$row}", ExcelDate::PHPToExcel($line['date']));
            $sheet->getStyle("B{$row}")->getNumberFormat()->setFormatCode('m/d/yyyy');
            $sheet->setCellValue("C{$row}", $line['keterangan']);
            if ($debit > 0) {
                $sheet->setCellValue("D{$row}", $debit);
            }
            if ($kredit > 0) {
                $sheet->setCellValue("E{$row}", $kredit);
            }

            // Rumus saldo berjalan (sama seperti template KAS HSR)
            if ($row === $firstDataRow) {
                $sheet->setCellValue("F{$row}", "=D{$row}-E{$row}");
            } else {
                $prev = $row - 1;
                $sheet->setCellValue("F{$row}", "=F{$prev}+D{$row}-E{$row}");
            }

            $sheet->getStyle("D{$row}")->getNumberFormat()->setFormatCode($rpMoneyFormat);
            $sheet->getStyle("E{$row}")->getNumberFormat()->setFormatCode($rpMoneyFormat);
            $sheet->getStyle("F{$row}")->getNumberFormat()->setFormatCode($rpSaldoFormat);

            $sheet->setCellValue("G{$row}", $line['staff']);

            $no++;
            $row++;
        }

        $lastDataRow = $row - 1;
        $totalRow = $row;
        $sheet->duplicateStyle($footerTotalStyle, "A{$totalRow}:G{$totalRow}");

        $sheet->setCellValue("C{$totalRow}", 'TOTAL');
        $sheet->setCellValue("D{$totalRow}", "=SUM(D{$firstDataRow}:D{$lastDataRow})");
        $sheet->setCellValue("E{$totalRow}", "=SUM(E{$firstDataRow}:E{$lastDataRow})");
        $sheet->getStyle("D{$totalRow}:E{$totalRow}")->getNumberFormat()->setFormatCode($rpMoneyFormat);

        $sisaRow = $totalRow + 1;
        $sheet->duplicateStyle($footerSisaStyle, "A{$sisaRow}:G{$sisaRow}");
        $sheet->setCellValue("C{$sisaRow}", 'SISA SALDO');
        $sheet->setCellValue("F{$sisaRow}", "=D{$totalRow}-E{$totalRow}");
        $sheet->getStyle("F{$sisaRow}")->getNumberFormat()->setFormatCode($rpSaldoFormat);

        $writer = new Xlsx($spreadsheet);
        $tempPath = storage_path('app/temp/kas-export-'.uniqid('', true).'.xlsx');
        if (! is_dir(dirname($tempPath))) {
            mkdir(dirname($tempPath), 0755, true);
        }
        $writer->save($tempPath);

        $filename = 'KAS_HSR_'.$monthLabel.'_'.$tahun;
        if ($namaAkun !== '') {
            $safeName = preg_replace('/[^a-zA-Z0-9_-]+/', '_', $namaAkun);
            $filename .= '_'.$safeName;
        }
        $filename .= '.xlsx';

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $row = $this->scopedQuery($request)->findOrFail($id);

        if ($row->is_lunas && ($user->role ?? null) !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya superadmin yang bisa menghapus biaya yang sudah lunas.',
            ], 403);
        }

        $this->deleteStoredPhotos($row->photo_paths ?? []);
        $row->delete();

        return response()->json(['success' => true]);
    }
}
