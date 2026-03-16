<?php

namespace App\Http\Controllers;

use App\Models\LogistikInventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class LogistikInventoryController extends Controller
{
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
        ]);

        $data = $request->only([
            'kode_barang',
            'nama_barang',
            'kategori',
            'stok',
            'lokasi'
        ]);

        // Upload Foto
        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $namaFile = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('logistik', $namaFile, 'public');

            $data['foto'] = 'storage/' . $path;
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
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $data = $request->only([
            'kode_barang',
            'nama_barang',
            'kategori',
            'stok',
            'lokasi'
        ]);

        // Upload Foto Baru
        if ($request->hasFile('foto')) {
            if ($barang->foto) {
                $oldPath = str_replace('storage/', '', $barang->foto);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                } elseif (File::exists(public_path($barang->foto))) {
                    File::delete(public_path($barang->foto));
                }
            }

            $file = $request->file('foto');
            $namaFile = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('logistik', $namaFile, 'public');

            $data['foto'] = 'storage/' . $path;
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
        if ($barang->foto) {
            $oldPath = str_replace('storage/', '', $barang->foto);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            } elseif (File::exists(public_path($barang->foto))) {
                File::delete(public_path($barang->foto));
            }
        }

        $barang->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil dihapus'
        ]);
    }
}
