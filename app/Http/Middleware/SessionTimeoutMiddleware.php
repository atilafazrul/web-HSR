<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SessionTimeoutMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Cek apakah user terautentikasi dengan Sanctum
        if ($request->user()) {
            $token = $request->user()->currentAccessToken();
            
            if ($token) {
                $timeoutMinutes = 15; // Session timeout 15 menit
                $now = now();
                
                // Cek last_used_at untuk menentukan apakah user sudah idle terlalu lama
                $lastUsedAt = $token->last_used_at ?? $token->created_at;
                
                // Jika user idle lebih dari 2 menit, expire session
                if ($lastUsedAt && $now->diffInMinutes($lastUsedAt) >= $timeoutMinutes) {
                    // Hapus token yang expired karena idle
                    $token->delete();
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Session Anda telah berakhir karena tidak ada aktivitas selama 15 menit. Silakan login kembali.',
                        'code' => 'SESSION_TIMEOUT'
                    ], 401);
                }
                
                // User masih aktif, update last_used_at
                $token->forceFill([
                    'last_used_at' => $now
                ])->save();
            }
        }

        return $next($request);
    }
}
