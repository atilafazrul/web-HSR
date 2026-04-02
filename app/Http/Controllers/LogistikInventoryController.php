<?php

namespace App\Http\Controllers;

use App\Models\LogistikInventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class LogistikInventoryController extends Controller
{
    private const MAX_FOTOS = 6;

    private function deleteLogistikFotoIfExists(?string $path): void
    {
        if (!$path) {
            return;
        }

        $oldPath = str_replace('storage/', '', $path);
        if (Storage::disk('public')->exists($oldPath)) {
            Storage::disk('public')->delete($oldPath);
            return;
        }

        if (File::exists(public_path($path))) {
            File::delete(public_path($path));
        }
    }

    private function deleteLogistikFotosArray($paths): void
    {
        if (!is_array($paths)) {
            return;
        }

        foreach ($paths as $p) {
            $this->deleteLogistikFotoIfExists(is_string($p) ? $p : null);
        }
    }

    private function storeLogistikFotos(Request $request): array
    {
        $stored = [];

        if ($request->hasFile('fotos')) {
            foreach ($request->file('fotos') as $file) {
                if (!$file) {
                    continue;
                }
                $namaFile = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('logistik', $namaFile, 'public');
                $stored[] = 'storage/' . $path;
            }
        }

        // Backward compatibility: allow legacy single `foto`.
        if (empty($stored) && $request->hasFile('foto')) {
            $file = $request->file('foto');
            $namaFile = time() . '_' . uniqid() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('logistik', $namaFile, 'public');
            $stored[] = 'storage/' . $path;
        }

        return $stored;
    }

    private function getExistingLogistikFotos(LogistikInventory $barang): array
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
     * @param  array<string, mixed>  $data
     */
    private function applyLogistikFotoSlots(Request $request, LogistikInventory $barang, array &$data): ?\Illuminate\Http\JsonResponse
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
            $uploaded = $this->storeLogistikFotos($request);
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

        $existingAllowed = $this->getExistingLogistikFotos($barang);
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
                $this->deleteLogistikFotoIfExists($old);
            }
        }

        $data['foto'] = $final[0] ?? null;
        if (Schema::hasColumn('logistik_inventories', 'fotos')) {
            $data['fotos'] = $final;
        }

        return null;
    }

    /* ================= GET ALL ================= */
    public function index()
    {
        $data = LogistikInventory::orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /* ================= CREATE ================= */
    public function store(Request $request)
    {
        $request->validate([
            'kode_barang' => 'required|unique:logistik_inventories,kode_barang',
            'nama_barang' => 'required',
            'kategori' => 'required',
            'stok' => 'required|integer',
            'lokasi' => 'nullable',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'fotos' => 'nullable|array|max:' . self::MAX_FOTOS,
            'fotos.*' => 'image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $data = $request->only([
            'kode_barang',
            'nama_barang',
            'kategori',
            'stok',
            'lokasi'
        ]);

        // Upload multiple photos (max 6). Keep `foto` as first photo for existing UI.
        $paths = $this->storeLogistikFotos($request);
        if (!empty($paths)) {
            $data['foto'] = $paths[0];
            if (Schema::hasColumn('logistik_inventories', 'fotos')) {
                $data['fotos'] = $paths;
            }
        }

        $barang = LogistikInventory::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil ditambahkan',
            'data' => $barang
        ]);
    }

    /* ================= SHOW ================= */
    public function show($id)
    {
        $barang = LogistikInventory::find($id);

        if (!$barang) {
            return response()->json([
                'success' => false,
                'message' => 'Barang tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $barang
        ]);
    }

    /* ================= UPDATE ================= */
    public function update(Request $request, $id)
    {
        $barang = LogistikInventory::find($id);

        if (!$barang) {
            return response()->json([
                'success' => false,
                'message' => 'Barang tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'kode_barang' => 'required|unique:logistik_inventories,kode_barang,' . $id,
            'nama_barang' => 'required',
            'kategori' => 'required',
            'stok' => 'required|integer',
            'lokasi' => 'nullable',
            'foto_slots' => 'nullable|string',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'fotos' => 'nullable|array|max:' . self::MAX_FOTOS,
            'fotos.*' => 'image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $data = $request->only([
            'kode_barang',
            'nama_barang',
            'kategori',
            'stok',
            'lokasi'
        ]);

        $slotsErr = $this->applyLogistikFotoSlots($request, $barang, $data);
        if ($slotsErr !== null) {
            return $slotsErr;
        }

        if (!$request->filled('foto_slots')) {
            $existing = $this->getExistingLogistikFotos($barang);
            $incomingCount = $this->countIncomingFotoFiles($request);
            if (($incomingCount + count($existing)) > self::MAX_FOTOS) {
                return response()->json([
                    'success' => false,
                    'message' => 'Total foto maksimal 6'
                ], 422);
            }

            // Upload Foto Baru (append to existing, keep old photos)
            if ($request->hasFile('fotos') || $request->hasFile('foto')) {
                $paths = $this->storeLogistikFotos($request);
                if (!empty($paths)) {
                    $merged = array_values(array_unique(array_merge($existing, $paths)));
                    $data['foto'] = $merged[0] ?? null;
                    if (Schema::hasColumn('logistik_inventories', 'fotos')) {
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
        $role = $request->header('role');

        if ($role !== 'super_admin' && $role !== 'admin' && $role !== 'logistik') {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses menghapus barang'
            ], 403);
        }

        $barang = LogistikInventory::find($id);

        if (!$barang) {
            return response()->json([
                'success' => false,
                'message' => 'Barang tidak ditemukan'
            ], 404);
        }

        // Hapus foto jika ada
        $this->deleteLogistikFotoIfExists($barang->foto);
        $this->deleteLogistikFotosArray($barang->fotos);

        $barang->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil dihapus'
        ]);
    }
}
