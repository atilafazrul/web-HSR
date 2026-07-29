<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$to = $argv[1] ?? '6285121102574';
$svc = app(\App\Services\WhatsAppService::class);

echo "enabled=" . (config('whatsapp.enabled') ? 'yes' : 'no') . "\n";
echo "provider=" . config('whatsapp.provider') . "\n";
echo "to={$to}\n";

$ok = $svc->send($to, 'Tes notifikasi HSR — abaikan jika berhasil.');
echo $ok ? "RESULT: OK\n" : "RESULT: FAIL (cek laravel.log)\n";
