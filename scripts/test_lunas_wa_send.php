<?php

/**
 * Kirim ulang WA lunas untuk dashboard biaya terbaru (test).
 * Usage: php scripts/test_lunas_wa_send.php [dashboard_biaya_id]
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DashboardBiaya;
use App\Models\User;
use App\Services\BiayaNotificationService;

$id = isset($argv[1]) ? (int) $argv[1] : null;
$row = $id
    ? DashboardBiaya::query()->find($id)
    : DashboardBiaya::query()->where('is_lunas', true)->orderByDesc('id')->first();

if (! $row) {
    fwrite(STDERR, "Dashboard biaya tidak ditemukan.\n");
    exit(1);
}

$approver = User::query()->where('role', 'super_admin')->first();
$creator = User::query()->find($row->created_by);

echo "biaya #{$row->id}\n";
echo "created_by={$row->created_by} name=".($creator?->name ?? '-')." phone=".($creator?->no_telepon ?: '(empty)')."\n";
echo "sending...\n";

$ok = app(BiayaNotificationService::class);
$ok->notifyDashboardBiayaLunas($row, $approver);

echo "done. cek WA & storage/logs/laravel.log\n";
