<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    private function ensureSuperAdmin(Request $request): void
    {
        $user = $request->user();

        if (!$user || ($user->role ?? null) !== 'super_admin') {
            abort(403, 'Hanya super admin yang dapat mengakses log aktivitas.');
        }
    }

    public function index(Request $request)
    {
        $this->ensureSuperAdmin($request);

        $query = ActivityLog::query()->orderByDesc('created_at');

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('user_name', 'like', "%{$search}%")
                    ->orWhere('user_email', 'like', "%{$search}%")
                    ->orWhere('route', 'like', "%{$search}%");
            });
        }

        if ($module = trim((string) $request->query('module', ''))) {
            $query->where('module', $module);
        }

        if ($action = trim((string) $request->query('action', ''))) {
            $query->where('action', $action);
        }

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', (int) $userId);
        }

        if ($from = $request->query('from')) {
            $query->whereDate('created_at', '>=', $from);
        }

        if ($to = $request->query('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        if ($request->query('status') === 'error') {
            $query->where('status_code', '>=', 400);
        } elseif ($request->query('status') === 'success') {
            $query->where(function ($q) {
                $q->whereNull('status_code')->orWhere('status_code', '<', 400);
            });
        }

        $perPage = min(max((int) $request->query('per_page', 25), 10), 100);
        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs,
        ]);
    }

    public function filters(Request $request)
    {
        $this->ensureSuperAdmin($request);

        $modules = ActivityLog::query()
            ->whereNotNull('module')
            ->distinct()
            ->orderBy('module')
            ->pluck('module');

        $actions = ActivityLog::query()
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        return response()->json([
            'success' => true,
            'data' => [
                'modules' => $modules,
                'actions' => $actions,
            ],
        ]);
    }

    public function summary(Request $request)
    {
        $this->ensureSuperAdmin($request);

        $today = now()->toDateString();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => ActivityLog::count(),
                'today' => ActivityLog::whereDate('created_at', $today)->count(),
                'unique_users_today' => ActivityLog::whereDate('created_at', $today)
                    ->whereNotNull('user_id')
                    ->distinct('user_id')
                    ->count('user_id'),
                'errors_today' => ActivityLog::whereDate('created_at', $today)
                    ->where('status_code', '>=', 400)
                    ->count(),
            ],
        ]);
    }
}
