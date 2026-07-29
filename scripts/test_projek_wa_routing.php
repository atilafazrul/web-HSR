<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$resolver = app(\App\Support\WhatsAppRecipientResolver::class);

foreach (['Service', 'service', 'SERVICE', 'Sales'] as $d) {
    $phones = $resolver->phonesForProjekAndBeritaAcara($d);
    echo "divisi={$d} => " . implode(', ', $phones) . "\n";
}

$svc = app(\App\Services\WhatsAppService::class);
$ok = $svc->notifyProjek('Tes proyek', 'Tes Sales ke Service', 'Service');
echo $ok ? "notifyProjek OK\n" : "notifyProjek FAIL\n";
