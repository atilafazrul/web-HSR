<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    // ================= LIST KARYAWAN =================
    public function index()
    {
        return response()->json(
            User::where('role', '!=', 'super_admin')->get()
        );
    }

    // ================= DETAIL =================
    public function show($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        return response()->json($user);
    }

    // ================= CREATE =================
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'role' => 'required|string',
            'divisi' => 'nullable|string',
            'password' => 'required|min:6'
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Karyawan berhasil ditambahkan',
            'data' => $user
        ]);
    }

    // ================= UPDATE =================
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'nik' => 'nullable|string|max:20',
            'name' => 'nullable|string|max:255',
            'tempat_lahir' => 'nullable|string',
            'tanggal_lahir' => 'nullable|date',
            'alamat' => 'nullable|string',
            'jenis_kelamin' => 'nullable|string',
            'agama' => 'nullable|string',
            'status_perkawinan' => 'nullable|string',
            'pekerjaan' => 'nullable|string',
            'no_telepon' => 'nullable|string|max:20',
            'golongan_darah' => 'nullable|string',
            'kontak_darurat_nama' => 'nullable|string',
            'kontak_darurat_hubungan' => 'nullable|string',
            'kontak_darurat_telepon' => 'nullable|string|max:20',
            'kontak_darurat_alamat' => 'nullable|string',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diperbarui',
            'data' => $user
        ]);
    }

    // ================= DELETE =================
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Karyawan berhasil dihapus'
        ]);
    }
}