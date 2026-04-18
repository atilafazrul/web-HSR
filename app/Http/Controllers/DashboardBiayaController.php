<?php

namespace App\Http\Controllers;

use App\Models\DashboardBiaya;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DashboardBiayaController extends Controller
{
    /** Kategori yang boleh melampirkan foto */
    protected function kategoriAllowsPhotos(?string $kategori): bool
    {
        return in_array($kategori, ['pengeluaran', 'reimbursment'], true);
    }

    protected function scopedQuery(Request $request)
    {
        $user = $request->user();
        $query = DashboardBiaya::query();

        if (($user->role ?? null) !== 'super_admin') {
            $query->where('divisi', $user->divisi);
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

        $wantsContentChange = $request->has('keterangan')
            || $request->has('nominal')
            || $request->hasFile('photos');

        $pendingLunasOff = ($user->role ?? null) === 'super_admin'
            && $request->has('is_lunas')
            && ! $request->boolean('is_lunas');

        if ($row->is_lunas && $wantsContentChange && ! $pendingLunasOff) {
            return response()->json([
                'success' => false,
                'message' => 'Biaya sudah lunas tidak bisa diubah.',
            ], 403);
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
        }

        $row->update($payload);

        return response()->json([
            'success' => true,
            'data' => tap($row->fresh(['creator:id,name', 'updater:id,name']), function ($fresh) {
                $fresh->creator_name = $fresh->creator?->name;
                $fresh->updater_name = $fresh->updater?->name;
            }),
        ]);
    }

    public function rekapPerAkun(Request $request)
    {
        $user = $request->user();

        if (($user->role ?? null) !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya superadmin yang bisa mengakses rekapitulasi per akun.',
            ], 403);
        }

        $bulan = $request->input('bulan');
        $tahun = $request->input('tahun');

        if (!$bulan || !$tahun) {
            return response()->json([
                'success' => false,
                'message' => 'Bulan dan tahun wajib diisi.',
            ], 422);
        }

        $query = DashboardBiaya::query();

        // Filter berdasarkan bulan dan tahun
        $query->whereYear('created_at', $tahun)
              ->whereMonth('created_at', $bulan);

        // Group by creator (nama akun)
        $dataByAkun = $query->with(['creator:id,name'])
            ->get()
            ->groupBy('created_by')
            ->map(function ($items) {
                $akun = $items->first()->creator;
                return [
                    'nama_akun' => $akun->name ?? 'Unknown',
                    'jalan' => $items->where('kategori', 'jalan')->sum('nominal'),
                    'pengeluaran' => $items->where('kategori', 'pengeluaran')->sum('nominal'),
                    'reimbursment' => $items->where('kategori', 'reimbursment')->sum('nominal'),
                    'total' => $items->sum('nominal'),
                ];
            })
            ->values()
            ->sortBy('nama_akun')
            ->values();

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
        $bulan = $request->input('bulan');
        $tahun = $request->input('tahun');

        if (!$nama) {
            return response()->json([
                'success' => false,
                'message' => 'Nama akun wajib diisi.',
            ], 422);
        }

        // Jika bulan dan tahun disediakan, hanya cari user yang memiliki biaya di periode tersebut
        if ($bulan && $tahun) {
            // Cari user dengan nama yang cocok DAN memiliki biaya di periode ini
            $users = \App\Models\User::where('name', 'LIKE', "%{$nama}%")
                ->whereHas('dashboardBiaya', function ($q) use ($bulan, $tahun) {
                    $q->whereYear('created_at', $tahun)
                      ->whereMonth('created_at', $bulan);
                })
                ->withCount('dashboardBiaya')
                ->orderBy('name', 'asc')
                ->limit(10)
                ->get()
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'nama_akun' => $u->name,
                        'name' => $u->name,
                    ];
                });
        } else {
            // Tanpa filter bulan/tahun, cari semua user dengan nama yang cocok
            $users = \App\Models\User::where('name', 'LIKE', "%{$nama}%")
                ->withCount('dashboardBiaya')
                ->orderBy('name', 'asc')
                ->limit(10)
                ->get()
                ->map(function ($u) {
                    return [
                        'id' => $u->id,
                        'nama_akun' => $u->name,
                        'name' => $u->name,
                    ];
                });
        }

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function rekapDetailAkun(Request $request)
    {
        $user = $request->user();

        if (($user->role ?? null) !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya superadmin yang bisa mengakses rekapitulasi per akun.',
            ], 403);
        }

        $bulan = $request->input('bulan');
        $tahun = $request->input('tahun');
        $createdBy = $request->input('created_by');

        if (!$bulan || !$tahun || !$createdBy) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter tidak lengkap.',
            ], 422);
        }

        $query = DashboardBiaya::query();

        // Filter berdasarkan bulan, tahun, dan creator
        $query->whereYear('created_at', $tahun)
              ->whereMonth('created_at', $bulan)
              ->where('created_by', $createdBy);

        $data = $query->with(['creator:id,name', 'updater:id,name'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
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
