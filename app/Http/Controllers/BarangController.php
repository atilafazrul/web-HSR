<?php

namespace App\Http\Controllers;

use App\Models\Barang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class BarangController extends Controller
{

    /* ================= GET ALL ================= */
    public function index()
    {
        $data = Barang::orderBy('id', 'desc')->get();

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
            'kategori' => 'required',
            'stok' => 'required|integer',
            'keterangan' => 'nullable|in:Siap Pakai,Rusak',
            'lokasi' => 'nullable',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $data = $request->only([
            'kode_barang',
            'nama_barang',
            'kategori',
            'stok',
            'keterangan',
            'lokasi'
        ]);

        // Default keterangan
        if (!isset($data['keterangan'])) {
            $data['keterangan'] = 'Siap Pakai';
        }

        // Upload Foto
        if ($request->hasFile('foto')) {

            $file = $request->file('foto');
            $namaFile = time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads'), $namaFile);

            $data['foto'] = 'uploads/' . $namaFile;
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
            'kategori' => 'required',
            'stok' => 'required|integer',
            'keterangan' => 'nullable|in:Siap Pakai,Rusak',
            'lokasi' => 'nullable',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $data = $request->only([
            'kode_barang',
            'nama_barang',
            'kategori',
            'stok',
            'keterangan',
            'lokasi'
        ]);

        // Upload Foto Baru
        if ($request->hasFile('foto')) {

            if ($barang->foto && File::exists(public_path($barang->foto))) {
                File::delete(public_path($barang->foto));
            }

            $file = $request->file('foto');
            $namaFile = time() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads'), $namaFile);

            $data['foto'] = 'uploads/' . $namaFile;
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
        if ($barang->foto && File::exists(public_path($barang->foto))) {
            File::delete(public_path($barang->foto));
        }

        $barang->delete();

        return response()->json([
            'success' => true,
            'message' => 'Barang berhasil dihapus'
        ]);
    }
}