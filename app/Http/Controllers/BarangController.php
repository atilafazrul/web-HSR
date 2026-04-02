<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class BarangController extends Controller
{
    private const MAX_FOTOS = 6;

    private function deleteBarangFotoIfExists(?string $path): void
    {
        if (!$path) {
            return;
        }

        if (File::exists(public_path($path))) {
            File::delete(public_path($path));
        }
    }

    private function deleteBarangFotosArray($paths): void
    {
        if (!is_array($paths)) {
            return;
        }

        foreach ($paths as $p) {
            $this->deleteBarangFotoIfExists(is_string($p) ? $p : null);
        }
    }

    private function storeBarangFotos(Request $request): array
    {
        $stored = [];

        if ($request->hasFile('fotos')) {
            foreach ($request->file('fotos') as $file) {
                if (!$file) {
                    continue;
                }

                $namaFile = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                // Put into storage/app/public/barangs so URL becomes /storage/barangs/...
                Storage::disk('public')->putFileAs(
                    'barangs',
                    $file,
                    $namaFile
                );
                $stored[] = 'storage/barangs/' . $namaFile;
            }
        }

        // Backward compatibility: allow legacy single `foto`.
        if (empty($stored) && $request->hasFile('foto')) {
            $file = $request->file('foto');
            $namaFile = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            Storage::disk('public')->putFileAs(
                'barangs',
                $file,
                $namaFile
            );
            $stored[] = 'storage/barangs/' . $namaFile;
        }

        return $stored;
    }

    /**
     * Migrate legacy photo paths from `uploads/...` to `storage/barangs/...`.
     * This runs lazily when listing/showing items.
     */
    private function migrateBarangPhotoPathIfNeeded(?string $path): ?string
    {
        if (!$path || !is_string($path)) {
            return $path;
        }

        // Already in new location
        if (str_starts_with($path, 'storage/barangs/')) {
            return $path;
        }

        // Legacy location
        if (str_starts_with($path, 'uploads/')) {
            $sourceAbs = public_path($path);
            if (!File::exists($sourceAbs)) {
                return $path;
            }

            $fileName = basename($path);
            $targetRel = 'storage/barangs/' . $fileName;
            $targetAbsDir = storage_path('app/public/barangs');
            $targetAbs = $targetAbsDir . DIRECTORY_SEPARATOR . $fileName;

            try {
                if (!File::exists($targetAbsDir)) {
                    File::makeDirectory($targetAbsDir, 0755, true);
                }
                // Move file from public/uploads -> storage/app/public/barangs
                File::move($sourceAbs, $targetAbs);
                return $targetRel;
            } catch (\Throwable $e) {
                // If migration fails, keep old path
                return $path;
            }
        }

        return $path;
    }

    private function migrateBarangPhotosIfNeeded(Barang $barang): void
    {
        $changed = false;

        if (Schema::hasColumn('barangs', 'fotos')) {
            $fotos = is_array($barang->fotos) ? $barang->fotos : [];
            $newF = [];
            foreach ($fotos as $p) {
                $np = $this->migrateBarangPhotoPathIfNeeded(is_string($p) ? $p : null);
                $newF[] = $np;
                if ($np !== $p) $changed = true;
            }
            $barang->fotos = $newF;
        }

        // Handle legacy single column
        if (!empty($barang->foto)) {
            $newFoto = $this->migrateBarangPhotoPathIfNeeded($barang->foto);
            if ($newFoto !== $barang->foto) {
                $barang->foto = $newFoto;
                $changed = true;
            }
        }

        if ($changed) {
            $barang->save();
        }
    }

    private function getExistingBarangFotos(Barang $barang): array
    {
        $existing = [];

        if (is_array($barang->fotos) && !empty($barang->fotos)) {
            $existing = array_values(array_filter($barang->fotos, fn($p) => is_string($p) && $p !== ''));
        } elseif (is_string($barang->foto) && $barang->foto !== '') {
            $existing = [$barang->foto];
        }

        return $existing;
    }

    private function countIncomingFotoFiles(Request $request): int
    {
        $count = 0;
        if ($request->hasFile('fotos')) {
            $count += count($request->file('fotos'));
        } elseif ($request->hasFile('foto')) {
            $count += 1;
        }
        return $count;
    }

    /**
     * Reorder / replace / remove photos using JSON plan:
     * ["uploads/a.png", "__UPLOAD__", ...] + matching count of uploaded files for __UPLOAD__ slots.
     *
     * @param  array<string, mixed>  $data
     */
    private function applyBarangFotoSlots(Request $request, Barang $barang, array &$data): ?\Illuminate\Http\JsonResponse
    {
        if (!$request->filled('foto_slots')) {
            return null;
        }

        $plan = json_decode($request->input('foto_slots'), true);
        if (!is_array($plan)) {
            return response()->json([
                'success' => false,
                'message' => 'foto_slots tidak valid',
            ], 422);
        }

        if (count($plan) > self::MAX_FOTOS) {
            return response()->json([
                'success' => false,
                'message' => 'Maksimal 6 foto',
            ], 422);
        }

        $uploadSlots = count(array_filter($plan, fn ($s) => $s === '__UPLOAD__'));
        $uploaded = [];

        if ($uploadSlots > 0) {
            if (!$request->hasFile('fotos') && !$request->hasFile('foto')) {
                return response()->json([
                    'success' => false,
                    'message' => 'File upload tidak sesuai jumlah slot',
                ], 422);
            }
            $uploaded = $this->storeBarangFotos($request);
            if (count($uploaded) !== $uploadSlots) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jumlah file upload tidak sesuai',
                ], 422);
            }
        } elseif ($request->hasFile('fotos') || $request->hasFile('foto')) {
            return response()->json([
                'success' => false,
                'message' => 'Ada file upload tapi tidak ada slot __UPLOAD__',
            ], 422);
        }

        $existingAllowed = $this->getExistingBarangFotos($barang);
        $final = [];
        $uploadIdx = 0;

        foreach ($plan as $step) {
            if ($step === '__UPLOAD__') {
                $final[] = $uploaded[$uploadIdx++];
            } elseif (is_string($step) && $step !== '') {
                if (!in_array($step, $existingAllowed, true)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Path foto tidak valid',
                    ], 422);
                }
                $final[] = $step;
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'foto_slots tidak valid',
                ], 422);
            }
        }

        foreach ($existingAllowed as $old) {
            if (!in_array($old, $final, true)) {
                $this->deleteBarangFotoIfExists($old);
            }
        }

        $data['foto'] = $final[0] ?? null;
        if (Schema::hasColumn('barangs', 'fotos')) {
            $data['fotos'] = $final;
        }

        return null;
    }

    /* ================= GET ALL ================= */
    public function index()
    {
        $data = Barang::orderBy('id', 'desc')->get();

        // Ensure paths are in `/storage/barangs` for UI/zoom gallery.
        foreach ($data as $barang) {
            try {
                $this->migrateBarangPhotosIfNeeded($barang);
            } catch (\Throwable $e) {
                // ignore to avoid breaking listing
            }
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }


    /* ================= CREATE ================= */
    public function store(Request $request)
    {
        $request->validate([
            'kode_barang' => 'required|unique:barangs',
            'nama_barang' => 'required',
            'merek' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'nomor_serial' => 'nullable|string|max:255',
            'kategori' => 'required',
            'stok' => 'required|integer',
            'keterangan' => 'nullable|in:Siap Pakai,Rusak',
            'lokasi' => 'nullable',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'fotos' => 'nullable|array|max:' . self::MAX_FOTOS,
            'fotos.*' => 'image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $data = $request->only([
            'kode_barang',
            'nama_barang',
            'merek',
            'model',
            'nomor_serial',
            'kategori',
            'stok',
            'keterangan',
            'lokasi'
        ]);

        // Default keterangan
        if (!isset($data['keterangan'])) {
            $data['keterangan'] = 'Siap Pakai';
        }

        // Upload multiple photos (max 6). Keep `foto` as first photo for existing UI.
        $paths = $this->storeBarangFotos($request);
        if (!empty($paths)) {
            $data['foto'] = $paths[0];
            if (Schema::hasColumn('barangs', 'fotos')) {
                $data['fotos'] = $paths;
            }
        }

        $barang = Barang::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil ditambahkan',
            'data' => $barang
        ]);
    }


    /* ================= SHOW ================= */
    public function show($id)
    {
        $barang = Barang::find($id);

        if (!$barang) {
            return response()->json([
                'success' => false,
                'message' => 'Barang tidak ditemukan'
            ], 404);
        }

        try {
            $this->migrateBarangPhotosIfNeeded($barang);
        } catch (\Throwable $e) {
            // ignore
        }

        return response()->json([
            'success' => true,
            'data' => $barang
        ]);
    }


    /* ================= UPDATE ================= */
    public function update(Request $request, $id)
    {
        $barang = Barang::find($id);

        if (!$barang) {
            return response()->json([
                'success' => false,
                'message' => 'Barang tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'kode_barang' => 'required|unique:barangs,kode_barang,' . $id,
            'nama_barang' => 'required',
            'merek' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'nomor_serial' => 'nullable|string|max:255',
            'kategori' => 'required',
            'stok' => 'required|integer',
            'keterangan' => 'nullable|in:Siap Pakai,Rusak',
            'lokasi' => 'nullable',
            'foto_slots' => 'nullable|string',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'fotos' => 'nullable|array|max:' . self::MAX_FOTOS,
            'fotos.*' => 'image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $data = $request->only([
            'kode_barang',
            'nama_barang',
            'merek',
            'model',
            'nomor_serial',
            'kategori',
            'stok',
            'keterangan',
            'lokasi'
        ]);

        $slotsErr = $this->applyBarangFotoSlots($request, $barang, $data);
        if ($slotsErr !== null) {
            return $slotsErr;
        }

        if (!$request->filled('foto_slots')) {
            $existing = $this->getExistingBarangFotos($barang);
            $incomingCount = $this->countIncomingFotoFiles($request);
            if (($incomingCount + count($existing)) > self::MAX_FOTOS) {
                return response()->json([
                    'success' => false,
                    'message' => 'Total foto maksimal 6'
                ], 422);
            }

            // Upload Foto Baru (append to existing, keep old photos)
            if ($request->hasFile('fotos') || $request->hasFile('foto')) {
                $paths = $this->storeBarangFotos($request);
                if (!empty($paths)) {
                    $merged = array_values(array_unique(array_merge($existing, $paths)));
                    $data['foto'] = $merged[0] ?? null;
                    if (Schema::hasColumn('barangs', 'fotos')) {
                        $data['fotos'] = $merged;
                    }
                }
            }
        }

        $barang->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil diupdate',
            'data' => $barang
        ]);
    }


    /* ================= DELETE ================= */
    public function destroy(Request $request, $id)
    {
        // 🔥 Ambil role dari header (dikirim dari React)
        $role = $request->header('role');

        if ($role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya super admin yang bisa menghapus barang'
            ], 403);
        }

        $barang = Barang::find($id);

        if (!$barang) {
            return response()->json([
                'success' => false,
                'message' => 'Barang tidak ditemukan'
            ], 404);
        }

        // Hapus foto jika ada
        $this->deleteBarangFotoIfExists($barang->foto);
        $this->deleteBarangFotosArray($barang->fotos);

        $barang->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil dihapus'
        ]);
    }
}