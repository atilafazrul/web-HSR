<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$payload = [
    'format' => 'pdf',
    'document_no' => 'DR-01-HSE 026',
    'tanggal' => '2026-04-04',
    'nama_pekerjaan' => 'TEST',
    'area_lokasi' => 'CSSD',
    'kegiatan' => 'Test',
    'jam_kerja_hari' => '8',
    'jam_kerja_kumulatif' => '12 Jam',
    'total_keseluruhan_jam' => 220,
    'informasi_kegiatan' => [
        ['lokasi' => 'RST', 'pekerja' => 10, 'jam_kerja' => 8, 'total_jam_kerja' => 80, 'total_keseluruhan' => 80, 'keterangan' => ''],
    ],
    'overtime' => ['pekerja' => 10, 'jam_kerja' => 4, 'total_jam_kerja' => 40, 'total_keseluruhan' => 40, 'keterangan' => ''],
    'kinerja_hse' => array_map(fn ($n) => ['no' => $n, 'tidak' => $n > 4, 'ya' => $n <= 4, 'keterangan' => ''], range(1, 15)),
    'peralatan' => [['jenis' => 'Jack', 'jumlah' => '1', 'waktu' => '07:00', 'kondisi' => 'CR']],
    'catatan_rekomendasi' => 'Test',
    'prepare_by' => 'Admin',
    'checked_by' => 'Latif',
    'approved_by' => 'Nanda',
];

$request = Illuminate\Http\Request::create('/api/daily-report/generate', 'POST', [], [], [], [
    'CONTENT_TYPE' => 'application/json',
    'HTTP_ACCEPT' => 'application/json',
], json_encode($payload));

try {
    $controller = new App\Http\Controllers\DailyReportController();
    $response = $controller->generate($request);
    echo 'Status: ' . $response->getStatusCode() . PHP_EOL;
    echo 'Content-Type: ' . $response->headers->get('Content-Type') . PHP_EOL;
} catch (Illuminate\Validation\ValidationException $e) {
    echo 'Validation failed:' . PHP_EOL;
    print_r($e->errors());
} catch (Throwable $e) {
    echo 'Error: ' . $e->getMessage() . PHP_EOL;
    echo $e->getFile() . ':' . $e->getLine() . PHP_EOL;
}
