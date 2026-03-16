<?php

namespace App\Http\Controllers;

use App\Models\Pembelian;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class PembelianController extends Controller
{
    /* ================= GET ALL ================= */
    public function index()
    {
        $data = Pembelian::orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /* ================= CREATE ================= */
    public function store(Request $request)
    {
        $request->validate([
            'no_po' => 'required|unique:pembelians,no_po',
            'nama_barang' => 'required',
            'supplier' => 'required',
            'tanggal' => 'required|date',
            'harga' => 'required|integer',
            'status' => 'required|in:Proses,Diterima',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $data = $request->only([
            'no_po',
            'nama_barang',
            'supplier',
            'tanggal',
            'harga',
            'status'
        ]);

        // Upload Foto
        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $namaFile = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('purchasing', $namaFile, 'public');

            $data['foto'] = 'storage/' . $path;
        }

        $pembelian = Pembelian::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Data pembelian berhasil ditambahkan',
            'data' => $pembelian
        ]);
    }

    /* ================= SHOW ================= */
    public function show($id)
    {
        $pembelian = Pembelian::find($id);

        if (!$pembelian) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $pembelian
        ]);
    }

    /* ================= UPDATE ================= */
    public function update(Request $request, $id)
    {
        $pembelian = Pembelian::find($id);

        if (!$pembelian) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $request->validate([
            'no_po' => 'required|unique:pembelians,no_po,' . $id,
            'nama_barang' => 'required',
            'supplier' => 'required',
            'tanggal' => 'required|date',
            'harga' => 'required|integer',
            'status' => 'required|in:Proses,Diterima',
            'foto' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $data = $request->only([
            'no_po',
            'nama_barang',
            'supplier',
            'tanggal',
            'harga',
            'status'
        ]);

        // Upload Foto Baru
        if ($request->hasFile('foto')) {
            if ($pembelian->foto) {
                $oldPath = str_replace('storage/', '', $pembelian->foto);
                if (\Illuminate\Support\Facades\Storage::disk('public')->exists($oldPath)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
                } elseif (File::exists(public_path($pembelian->foto))) {
                    File::delete(public_path($pembelian->foto));
                }
            }

            $file = $request->file('foto');
            $namaFile = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('purchasing', $namaFile, 'public');

            $data['foto'] = 'storage/' . $path;
        }

        $pembelian->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Data pembelian berhasil diupdate',
            'data' => $pembelian
        ]);
    }

    /* ================= DELETE ================= */
    public function destroy(Request $request, $id)
    {
        $role = $request->header('role');

        if ($role !== 'super_admin' && $role !== 'admin' && $role !== 'purchasing') {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses menghapus data ini'
            ], 403);
        }

        $pembelian = Pembelian::find($id);

        if (!$pembelian) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        // Hapus foto jika ada
        if ($pembelian->foto) {
            $oldPath = str_replace('storage/', '', $pembelian->foto);
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($oldPath)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
            } elseif (File::exists(public_path($pembelian->foto))) {
                File::delete(public_path($pembelian->foto));
            }
        }

        $pembelian->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data pembelian berhasil dihapus'
        ]);
    }
}
