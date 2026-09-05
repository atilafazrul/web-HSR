<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && ! (bool) ($user->is_active ?? true)) {
            $user->tokens()->delete();

            return response()->json([
                'success' => false,
                'message' => 'Akun Anda dinonaktifkan. Hubungi superadmin.',
                'code' => 'ACCOUNT_DISABLED',
            ], 401);
        }

        return $next($request);
    }
}
