<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ActivityLogService
{
    private const SENSITIVE_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'new_password',
        'token',
        'remember_token',
        '_token',
    ];

    /**
     * Hanya log aksi penting — bukan login, logout, atau navigasi/browsing (GET).
     *
     * @var array<int, array{0: string[], 1: string}>
     */
    private const IMPORTANT_ROUTE_RULES = [
        // Keuangan & pembayaran
        [['POST', 'PATCH', 'DELETE'], '#^api/dashboard-biaya#'],
        [['GET'], '#^api/dashboard-biaya/export-kas$#'],
        [['POST', 'PATCH'], '#^api/projek-kerja/\d+/uang$#'],
        [['PATCH'], '#^api/projek-kerja/\d+/lunas$#'],
        [['PATCH'], '#^api/projek-kerja/\d+/biaya-item-lunas$#'],
        [['PATCH'], '#^api/projek-kerja/\d+/nominal-po$#'],
        [['GET'], '#^api/projek-kerja/\d+/export-biaya$#'],

        // Pembelian
        [['POST', 'PUT', 'PATCH', 'DELETE'], '#^api/pembelian#'],

        // Proyek kerja (perubahan penting)
        [['POST'], '#^api/projek-kerja$#'],
        [['PUT', 'PATCH', 'DELETE'], '#^api/projek-kerja/\d+$#'],
        [['PATCH'], '#^api/projek-kerja/\d+/status$#'],
        [['PATCH'], '#^api/projek-kerja/\d+/archive$#'],
        [['PATCH'], '#^api/projek-kerja/\d+/unarchive$#'],

        // Foto & dokumen proyek
        [['POST'], '#^api/projek-kerja/\d+/add-photo$#'],
        [['DELETE'], '#^api/projek-kerja/photo/\d+$#'],
        [['POST', 'DELETE'], '#^api/projek-kerja/\d+/folders$#'],
        [['POST'], '#^api/projek-kerja/\d+/add-file$#'],
        [['DELETE'], '#^api/projek-kerja/file/\d+$#'],

        // Karyawan
        [['POST', 'PUT', 'PATCH', 'DELETE'], '#^api/karyawan#'],

        // Cuti
        [['POST'], '#^api/cuti$#'],
        [['POST'], '#^api/cuti/\d+/approve$#'],
        [['POST'], '#^api/cuti/\d+/reject$#'],
        [['PUT', 'PATCH', 'DELETE'], '#^api/cuti/\d+$#'],
        [['POST'], '#^api/cuti/\d+/update$#'],

        // Berita acara (generate & hapus dokumen)
        [['POST'], '#^api/(bast|bauf|bam|sppd)(/pdf)?$#'],
        [['PUT', 'PATCH', 'DELETE'], '#^api/(bast|bauf|bam|sppd)/\d+$#'],
    ];

    public function shouldLog(Request $request): bool
    {
        $method = strtoupper($request->method());
        $path = $this->normalizePath($request->path());

        if (Str::startsWith($path, 'api/activity-logs')) {
            return false;
        }

        foreach (self::IMPORTANT_ROUTE_RULES as [$methods, $pattern]) {
            if (in_array($method, $methods, true) && preg_match($pattern, $path)) {
                return true;
            }
        }

        return false;
    }

    public function logFromRequest(
        Request $request,
        ?int $statusCode = null,
        ?User $user = null,
        ?Response $response = null
    ): ?ActivityLog {
        if (!$this->shouldLog($request)) {
            return null;
        }

        $user = $user ?? $request->user();
        $method = strtoupper($request->method());
        $path = $this->normalizePath($request->path());
        [$module, $baseAction, $description] = $this->describeRoute($method, $path);
        $description = $this->enrichFolderDescription($request, $method, $path, $description);

        $isError = $statusCode !== null && $statusCode >= 400;
        $errorMessage = $isError ? $this->extractErrorMessage($response) : null;
        $action = $isError && $baseAction !== 'login_failed' ? 'error' : $baseAction;

        if ($isError) {
            $description = $description . ' — Gagal (HTTP ' . $statusCode . ')';
            if ($errorMessage) {
                $description .= ': ' . Str::limit($errorMessage, 150, '...');
            }
        }

        $properties = $this->buildProperties($request, $path);
        $properties['success'] = !$isError;
        if ($isError) {
            $properties['original_action'] = $baseAction;
            if ($errorMessage) {
                $properties['error_message'] = $errorMessage;
            }
        }

        return $this->log([
            'user_id' => $user?->id,
            'user_name' => $user?->name,
            'user_email' => $user?->email,
            'user_role' => $user?->role,
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'method' => $method,
            'route' => '/' . $path,
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 500, ''),
            'status_code' => $statusCode,
            'properties' => $properties,
        ]);
    }

    public function logAuthEvent(
        string $action,
        string $description,
        ?User $user = null,
        ?Request $request = null,
        array $extra = []
    ): ActivityLog {
        return $this->log([
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? ($extra['email'] ?? null),
            'user_email' => $user?->email ?? ($extra['email'] ?? null),
            'user_role' => $user?->role,
            'action' => $action,
            'module' => 'auth',
            'description' => $description,
            'method' => $request ? strtoupper($request->method()) : 'POST',
            'route' => $request ? '/' . $this->normalizePath($request->path()) : '/api/login',
            'ip_address' => $request?->ip(),
            'user_agent' => $request ? Str::limit((string) $request->userAgent(), 500, '') : null,
            'status_code' => $extra['status_code'] ?? null,
            'properties' => array_filter([
                'email' => $extra['email'] ?? $user?->email,
                'success' => $extra['success'] ?? null,
            ]),
        ]);
    }

    public function log(array $data): ActivityLog
    {
        return ActivityLog::create($data);
    }

    private function normalizePath(string $path): string
    {
        return ltrim(strtolower($path), '/');
    }

    private function extractErrorMessage(?Response $response): ?string
    {
        if (!$response) {
            return null;
        }

        $content = $response->getContent();
        if (!is_string($content) || $content === '') {
            return null;
        }

        $data = json_decode($content, true);
        if (!is_array($data)) {
            return null;
        }

        if (!empty($data['message']) && is_string($data['message'])) {
            return $data['message'];
        }

        if (!empty($data['errors']) && is_array($data['errors'])) {
            foreach ($data['errors'] as $messages) {
                if (is_array($messages) && isset($messages[0]) && is_string($messages[0])) {
                    return $messages[0];
                }
                if (is_string($messages)) {
                    return $messages;
                }
            }
        }

        return null;
    }

    private function buildProperties(Request $request, string $path): array
    {
        $properties = [
            'route_params' => $request->route()?->parameters() ?? [],
        ];

        if (in_array(strtoupper($request->method()), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            $payload = $this->sanitizePayload($request->all());
            if (!empty($payload)) {
                $properties['payload'] = $payload;
            }
        }

        if (preg_match('#^api/projek-kerja/\d+/folders$#', $path)) {
            $properties['subject'] = 'projek_folder';
            $properties['folder_name'] = $this->sanitizeFolderName($request->input('folder_name'));
            $properties['folder_type'] = $request->input('type');
        }

        if (Str::contains($path, 'projek-kerja')) {
            $properties['subject'] = 'projek_kerja';
        } elseif (Str::contains($path, 'cuti')) {
            $properties['subject'] = 'cuti';
        } elseif (Str::contains($path, 'karyawan')) {
            $properties['subject'] = 'karyawan';
        }

        return $properties;
    }

    private function sanitizePayload(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            $normalizedKey = strtolower((string) $key);

            if (in_array($normalizedKey, self::SENSITIVE_KEYS, true)) {
                $sanitized[$key] = '[REDACTED]';
                continue;
            }

            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizePayload($value);
                continue;
            }

            if ($value instanceof \Illuminate\Http\UploadedFile) {
                $sanitized[$key] = '[FILE:' . $value->getClientOriginalName() . ']';
                continue;
            }

            if (is_string($value) && strlen($value) > 500) {
                $sanitized[$key] = Str::limit($value, 500, '...');
                continue;
            }

            $sanitized[$key] = $value;
        }

        return $sanitized;
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    private function enrichFolderDescription(Request $request, string $method, string $path, string $description): string
    {
        if (!preg_match('#^api/projek-kerja/\d+/folders$#', $path)) {
            return $description;
        }

        $folderName = $this->sanitizeFolderName($request->input('folder_name'));
        if (!$folderName) {
            return $description;
        }

        $typeLabel = $request->input('type') === 'photo' ? 'foto' : 'dokumen';

        if ($method === 'DELETE') {
            return "Menghapus folder {$typeLabel}: {$folderName}";
        }

        return "Membuat folder {$typeLabel}: {$folderName}";
    }

    private function sanitizeFolderName(?string $name): ?string
    {
        $raw = trim((string) $name);
        if ($raw === '') {
            return null;
        }

        $sanitized = preg_replace('/[^a-zA-Z0-9 _-]/', '', $raw);
        $sanitized = preg_replace('/\s+/', '_', (string) $sanitized);
        $sanitized = trim((string) $sanitized, '_- ');

        return $sanitized !== '' ? $sanitized : null;
    }

    private function describeRoute(string $method, string $path): array
    {
        if (preg_match('#^api/projek-kerja/\d+/folders$#', $path)) {
            if ($method === 'DELETE') {
                return ['projek_kerja', 'delete', 'Menghapus folder proyek'];
            }

            return ['projek_kerja', 'folder', 'Membuat folder proyek'];
        }

        $patterns = [
            ['#^api/karyawan$#', 'karyawan', 'karyawan', 'Mengelola data karyawan'],
            ['#^api/karyawan/\d+#', 'karyawan', 'karyawan', 'Mengelola data karyawan'],
            ['#^api/projek-kerja$#', 'projek_kerja', 'create', 'Membuat proyek kerja baru'],
            ['#^api/projek-kerja/\d+/status$#', 'projek_kerja', 'status', 'Mengubah status proyek kerja'],
            ['#^api/projek-kerja/\d+/uang$#', 'projek_kerja', 'biaya', 'Memperbarui biaya/pembayaran proyek'],
            ['#^api/projek-kerja/\d+/lunas$#', 'projek_kerja', 'lunas', 'Menandai pembayaran lunas'],
            ['#^api/projek-kerja/\d+/biaya-item-lunas$#', 'projek_kerja', 'lunas', 'Menandai item biaya lunas'],
            ['#^api/projek-kerja/\d+/nominal-po$#', 'projek_kerja', 'biaya', 'Memperbarui nominal PO'],
            ['#^api/projek-kerja/\d+/export-biaya$#', 'projek_kerja', 'export', 'Mengekspor data biaya proyek'],
            ['#^api/projek-kerja/\d+/archive$#', 'projek_kerja', 'archive', 'Mengarsipkan proyek kerja'],
            ['#^api/projek-kerja/\d+/unarchive$#', 'projek_kerja', 'unarchive', 'Membuka arsip proyek kerja'],
            ['#^api/projek-kerja/\d+/add-photo$#', 'projek_kerja', 'photo', 'Mengunggah foto proyek'],
            ['#^api/projek-kerja/photo/\d+$#', 'projek_kerja', 'photo', 'Menghapus foto proyek'],
            ['#^api/projek-kerja/\d+/add-file$#', 'projek_kerja', 'file', 'Mengunggah dokumen proyek'],
            ['#^api/projek-kerja/file/\d+$#', 'projek_kerja', 'file', 'Menghapus dokumen proyek'],
            ['#^api/projek-kerja/\d+$#', 'projek_kerja', 'update', 'Memperbarui proyek kerja'],
            ['#^api/pembelian#', 'purchasing', 'pembelian', 'Mengelola data pembelian'],
            ['#^api/dashboard-biaya/export-kas$#', 'biaya', 'export', 'Mengekspor kas keuangan'],
            ['#^api/dashboard-biaya#', 'biaya', 'biaya', 'Mengelola biaya/pengeluaran'],
            ['#^api/bast#', 'berita_acara', 'bast', 'Mengelola dokumen BAST'],
            ['#^api/bauf#', 'berita_acara', 'bauf', 'Mengelola dokumen BAUF'],
            ['#^api/bam#', 'berita_acara', 'bam', 'Mengelola dokumen BAM'],
            ['#^api/sppd#', 'berita_acara', 'sppd', 'Mengelola dokumen SPPD'],
            ['#^api/cuti/\d+/approve$#', 'cuti', 'approve', 'Menyetujui pengajuan cuti'],
            ['#^api/cuti/\d+/reject$#', 'cuti', 'reject', 'Menolak pengajuan cuti'],
            ['#^api/cuti#', 'cuti', 'cuti', 'Mengelola pengajuan cuti'],
        ];

        foreach ($patterns as [$pattern, $module, $action, $description]) {
            if (preg_match($pattern, $path)) {
                return [$module, $this->resolveAction($method, $action), $this->resolveDescription($method, $description)];
            }
        }

        $fallbackModule = Str::before($path, '/') ?: 'sistem';
        $fallbackAction = $this->methodToAction($method);

        return [
            $fallbackModule,
            $fallbackAction,
            $this->resolveDescription($method, ucfirst($fallbackAction) . ' ' . str_replace('/', ' ', Str::after($path, 'api/'))),
        ];
    }

    private function methodToAction(string $method): string
    {
        return match ($method) {
            'POST' => 'create',
            'PUT', 'PATCH' => 'update',
            'DELETE' => 'delete',
            default => 'view',
        };
    }

    private function resolveAction(string $method, string $baseAction): string
    {
        if (in_array($baseAction, ['approve', 'reject', 'archive', 'unarchive', 'export', 'status', 'biaya', 'lunas', 'create', 'photo', 'file', 'folder'], true)) {
            return $baseAction;
        }

        return $this->methodToAction($method);
    }

    private function resolveDescription(string $method, string $baseDescription): string
    {
        if ($method === 'GET') {
            if (!Str::startsWith(strtolower($baseDescription), 'melihat')) {
                return 'Melihat ' . lcfirst($baseDescription);
            }
            return $baseDescription;
        }

        if ($method === 'POST' && !Str::contains(strtolower($baseDescription), ['membuat', 'mengelola', 'login', 'logout', 'menyetujui', 'menolak'])) {
            return 'Membuat ' . lcfirst($baseDescription);
        }

        if (in_array($method, ['PUT', 'PATCH'], true) && !Str::contains(strtolower($baseDescription), ['memperbarui', 'mengubah', 'mengelola'])) {
            return 'Memperbarui ' . lcfirst($baseDescription);
        }

        if ($method === 'DELETE' && !Str::startsWith(strtolower($baseDescription), 'menghapus')) {
            return 'Menghapus ' . lcfirst($baseDescription);
        }

        return $baseDescription;
    }
}
