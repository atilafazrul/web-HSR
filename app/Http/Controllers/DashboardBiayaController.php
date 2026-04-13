<?php

namespace App\Http\Controllers;

use App\Models\DashboardBiaya;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DashboardBiayaController extends Controller
{
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
            ->limit(50)
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
        if ($hasAnyPhoto && $request->input('kategori') !== 'reimbursment') {
            return response()->json([
                'success' => false,
                'message' => 'Foto hanya untuk kategori Reimbursment.',
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
            'photos' => 'nullable|array|max:25',
            'photos.*' => 'image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        if ($request->has('is_lunas') && ($user->role ?? null) !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya superadmin yang bisa mengubah status lunas biaya dashboard.',
            ], 403);
        }

        $payload = ['updated_by' => $user->id ?? null];
        if ($request->has('keterangan')) {
            $payload['keterangan'] = $request->input('keterangan');
        }
        if ($request->hasFile('photos')) {
            if ($row->kategori !== 'reimbursment') {
                return response()->json([
                    'success' => false,
                    'message' => 'Foto hanya untuk kategori Reimbursment.',
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

    public function destroy(Request $request, $id)
    {
        $row = $this->scopedQuery($request)->findOrFail($id);
        $this->deleteStoredPhotos($row->photo_paths ?? []);
        $row->delete();

        return response()->json(['success' => true]);
    }
}
