<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\DashboardBiaya;
use App\Models\Notification;
use App\Models\User;

echo "=== Recent dashboard biaya ===\n";
$rows = DashboardBiaya::query()->orderByDesc('id')->limit(5)->get([
    'id', 'kategori', 'nominal', 'is_lunas', 'created_by', 'keterangan', 'updated_at',
]);
foreach ($rows as $r) {
    $creator = $r->created_by ? User::find($r->created_by) : null;
    echo sprintf(
        "#%d created_by=%s name=%s phone=%s lunas=%s nominal=%s ket=%s\n",
        $r->id,
        $r->created_by ?? 'NULL',
        $creator?->name ?? '-',
        $creator?->no_telepon ?: '(empty)',
        $r->is_lunas ? '1' : '0',
        $r->nominal,
        $r->keterangan
    );
}

echo "\n=== Recent biaya_dilunasi notifications ===\n";
$notifs = Notification::query()
    ->where('type', 'biaya_dilunasi')
    ->orderByDesc('id')
    ->limit(5)
    ->get(['id', 'user_id', 'title', 'message', 'created_at']);
if ($notifs->isEmpty()) {
    echo "(none)\n";
} else {
    foreach ($notifs as $n) {
        echo "#{$n->id} user={$n->user_id} {$n->title} | {$n->message}\n";
    }
}

echo "\n=== Admins with phone ===\n";
$users = User::query()
    ->whereIn('role', ['admin', 'super_admin', 'user'])
    ->whereNotNull('no_telepon')
    ->where('no_telepon', '!=', '')
    ->get(['id', 'name', 'role', 'no_telepon']);
foreach ($users as $u) {
    echo "#{$u->id} {$u->name} ({$u->role}) phone={$u->no_telepon}\n";
}
