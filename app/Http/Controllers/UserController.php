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
        $users = User::where('role','!=','super_admin')->get();

        return response()->json([
            'success'=>true,
            'data'=>$users
        ]);
    }

    // ================= DETAIL =================
    public function show($id)
    {
        $user = User::find($id);

        if(!$user){
            return response()->json([
                'success'=>false,
                'message'=>'User tidak ditemukan'
            ],404);
        }

        return response()->json([
            'success'=>true,
            'user'=>$user
        ]);
    }

    // ================= CREATE =================
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'=>'required|string|max:255',
            'email'=>'required|email|unique:users',
            'role'=>'required|string',
            'divisi'=>'nullable|string',
            'password'=>'required|min:6'
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);

        return response()->json([
            'success'=>true,
            'message'=>'Karyawan berhasil ditambahkan',
            'data'=>$user
        ]);
    }

    // ================= UPDATE PROFILE =================
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'nik' => 'nullable|string|max:20',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email',

            // Field untuk nomor telepon (terima kedua format)
            'phone' => 'nullable|string|max:20',
            'no_telepon' => 'nullable|string|max:20',  // <-- TAMBAHKAN INI

            'alamat' => 'nullable|string',

            'tempat_lahir' => 'nullable|string',
            'tanggal_lahir' => 'nullable|date',

            'jenis_kelamin' => 'nullable|string',
            'agama' => 'nullable|string',
            'status_perkawinan' => 'nullable|string',

            'pekerjaan' => 'nullable|string',
            'golongan_darah' => 'nullable|string',

            'kontak_darurat_nama' => 'nullable|string',
            'kontak_darurat_hubungan' => 'nullable|string',
            'kontak_darurat_telepon' => 'nullable|string|max:20',
            'kontak_darurat_alamat' => 'nullable|string',
        ]);

        // Jika ada no_telepon tapi tidak ada phone, sinkronisasi data
        if ($request->has('no_telepon') && !$request->has('phone')) {
            $validated['phone'] = $request->no_telepon;
        }
        
        // Jika ada phone tapi tidak ada no_telepon, sinkronisasi data
        if ($request->has('phone') && !$request->has('no_telepon')) {
            $validated['no_telepon'] = $request->phone;
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diperbarui',
            'user' => $user
        ]);
    }

    // ================= DELETE =================
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'success'=>true,
            'message'=>'Karyawan berhasil dihapus'
        ]);
    }
}