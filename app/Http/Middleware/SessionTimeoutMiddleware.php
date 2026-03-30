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
            
            // Jika token ada dan sudah expired
            if ($token && $token->expires_at && $token->expires_at->isPast()) {
                // Hapus token yang expired
                $token->delete();
                
                return response()->json([
                    'success' => false,
                    'message' => 'Session Anda telah berakhir. Silakan login kembali.',
                    'code' => 'SESSION_TIMEOUT'
                ], 401);
            }
            
            // Update last_used_at jika ada
            if ($token && method_exists($token, 'forceFill')) {
                $token->forceFill(['last_used_at' => now()])->save();
            }
        }

        return $next($request);
    }
}