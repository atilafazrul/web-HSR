<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user dan generate token
     */
    public function login(Request $request)
    {
        // Validasi input
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'remember_me' => 'boolean'
        ]);

        // Cari user
        $user = User::where('email', $request->email)->first();

        // Jika tidak ditemukan atau password salah
        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah'],
            ]);
        }

        // Cek remember_me untuk menentukan expiration
        $rememberMe = $request->boolean('remember_me', false);
        
        if ($rememberMe) {
            // Remember me: 7 hari
            $expirationMinutes = 60 * 24 * 7;
            $token = $user->createToken('auth-token', ['*'], now()->addMinutes($expirationMinutes));
        } else {
            // Normal: 15 menit (sesuai config sanctum)
            $token = $user->createToken('auth-token');
        }

        // Hitung waktu expired
        $expiresAt = $rememberMe 
            ? now()->addMinutes(60 * 24 * 7)
            : now()->addMinutes(15);

        // Jika login berhasil
        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'user' => $user,
                'token' => $token->plainTextToken,
                'expires_at' => $expiresAt->toISOString(),
                'expires_in_seconds' => $rememberMe ? 60 * 24 * 7 * 60 : 15 * 60,
                'remember_me' => $rememberMe
            ]
        ]);
    }

    /**
     * Logout user dan revoke token
     */
    public function logout(Request $request)
    {
        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil'
        ]);
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $request->user()
            ]
        ]);
    }
}