<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$builder = $app->make(App\Services\WorkChecklistStructureBuilder::class);

foreach (['planning', 'realisasi'] as $type) {
    $template = $builder->templatePath($type);
    $json = $builder->jsonPath($type);
    echo "{$type}:\n";
    echo "  template: {$template} => " . (file_exists($template) ? 'OK' : 'MISSING') . "\n";
    echo "  json: {$json} => " . (file_exists($json) ? 'OK' : 'MISSING') . "\n";
    $data = $builder->loadOrBuild($type);
    echo "  loadOrBuild: " . ($data === null ? 'NULL' : 'OK') . "\n";
}
