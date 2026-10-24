<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
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

        // Key unik per email dan alamat IP
        $throttleKey = Str::transliterate(Str::lower($request->email) . '|' . $request->ip());

        // Cek apakah sudah 5 kali gagal dalam 5 menit terakhir
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            $minutes = ceil($seconds / 60);

            return response()->json([
                'success' => false,
                'message' => "Terlalu banyak percobaan login yang gagal. Akun diblokir sementara. Silakan coba lagi dalam {$minutes} menit.",
                'retry_after' => $seconds,
            ], 429);
        }

        // Cari user
        $user = User::where('email', $request->email)->first();

        // Jika tidak ditemukan atau password salah
        if (!$user || !Hash::check($request->password, $user->password)) {
            // Catat 1 kegagalan dengan decay 300 detik (5 menit)
            RateLimiter::hit($throttleKey, 300);

            $remaining = RateLimiter::remaining($throttleKey, 5);
            $pesan = $remaining > 0
                ? "Email atau password salah. Sisa percobaan: {$remaining} kali lagi."
                : "Email atau password salah. Batas 5 kali percobaan tercapai, akun diblokir sementara selama 5 menit.";

            throw ValidationException::withMessages([
                'email' => [$pesan],
            ]);
        }

        if (! (bool) ($user->is_active ?? true)) {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda dinonaktifkan. Hubungi superadmin.'],
            ]);
        }

        // Login berhasil, bersihkan riwayat percobaan gagal
        RateLimiter::clear($throttleKey);

        // Cek remember_me untuk menentukan expiration
        $rememberMe = $request->boolean('remember_me', false);
        
        if ($rememberMe) {
            // Remember me: 7 hari
            $expirationMinutes = 60 * 24 * 7;
            $token = $user->createToken('auth-token', ['*'], now()->addMinutes($expirationMinutes));
        } else {
            // Normal: 60 menit idle session
            $expirationMinutes = 60;
            $token = $user->createToken('auth-token', ['*'], now()->addMinutes($expirationMinutes));
        }

        // Hitung waktu expired
        $expiresAt = $rememberMe 
            ? now()->addMinutes(60 * 24 * 7)
            : now()->addMinutes(60);

        // Jika login berhasil
        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'user' => $user,
                'token' => $token->plainTextToken,
                'expires_at' => $expiresAt->toISOString(),
                'expires_in_seconds' => $rememberMe ? 60 * 24 * 7 * 60 : 60 * 60,
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