<?php

/**
 * Bootstrap minimal work checklist Excel templates for local development.
 * Production should use the real formatted templates from the team.
 */

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$bootstrap = $app->make(App\Services\WorkChecklistDevTemplateBootstrap::class);
$bootstrap->bootstrapMissing();

$builder = $app->make(App\Services\WorkChecklistStructureBuilder::class);

foreach (['planning', 'realisasi'] as $type) {
    $data = $builder->loadOrBuild($type);
    $count = $type === 'realisasi'
        ? count($data['groups'] ?? [])
        : count($data['items'] ?? []);
    echo "{$type} structure: {$count} entries -> " . $builder->jsonPath($type) . "\n";
}

echo "Done.\n";
