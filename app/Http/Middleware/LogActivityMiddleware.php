<?php

namespace App\Http\Middleware;

use App\Services\ActivityLogService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogActivityMiddleware
{
    public function __construct(
        private ActivityLogService $activityLogService
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        try {
            $this->activityLogService->logFromRequest(
                $request,
                $response->getStatusCode(),
                $request->user(),
                $response
            );
        } catch (\Throwable) {
            // Jangan ganggu response utama jika logging gagal
        }

        return $response;
    }
}
