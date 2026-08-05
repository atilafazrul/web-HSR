<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Hanya item PERSIS seperti yang terlihat di screenshot yang diberikan user.
$targets = [
    ['projek' => 60, 'kategori' => 'pengeluaran', 'nominal' => 120000.00, 'keterangan' => 'makan minum', 'oleh' => 'Super Admin'],
    ['projek' => 91, 'kategori' => 'jalan', 'nominal' => 100000.00, 'keterangan' => 'UJ PPKP Deka1 08/05', 'oleh' => 'Deka Fachrizal'],
    ['projek' => 91, 'kategori' => 'jalan', 'nominal' => 100000.00, 'keterangan' => 'Dheka aditya irawan 8 Mei 2026', 'oleh' => 'Deka Fachrizal'],
    ['projek' => 91, 'kategori' => 'pengeluaran', 'nominal' => 150000.00, 'keterangan' => 'Konsumsi', 'oleh' => 'Deka Fachrizal'],
    ['projek' => 91, 'kategori' => 'pengeluaran', 'nominal' => 150000.00, 'keterangan' => 'Tukang Angkut', 'oleh' => 'Deka Fachrizal'],
    ['projek' => 91, 'kategori' => 'pengeluaran', 'nominal' => 400000.00, 'keterangan' => 'Sewa Losbak', 'oleh' => 'Deka Fachrizal'],
    ['projek' => 61, 'kategori' => 'reimbursment', 'nominal' => 1606000.00, 'keterangan' => 'Belanja material', 'oleh' => 'Latif'],
    ['projek' => 61, 'kategori' => 'reimbursment', 'nominal' => 1096995.00, 'keterangan' => 'Belanja material', 'oleh' => 'Latif'],
    ['projek' => 61, 'kategori' => 'jalan', 'nominal' => 1400000.00, 'keterangan' => 'UJ Deka1 18/07 - 24/07', 'oleh' => 'Deka Fachrizal'],
    ['projek' => 61, 'kategori' => 'reimbursment', 'nominal' => 525000.00, 'keterangan' => 'UM Deka1 18/07 - 24/07', 'oleh' => 'Deka Fachrizal'],
];

$idsToDelete = [];
foreach ($targets as $t) {
    $rows = DB::table('projek_kerja_biayas')
        ->where('projek_kerja_id', $t['projek'])
        ->where('kategori', $t['kategori'])
        ->where('nominal', $t['nominal'])
        ->where('keterangan', $t['keterangan'])
        ->where('oleh', $t['oleh'])
        ->orderBy('id')
        ->get();

    echo "projek={$t['projek']} kategori={$t['kategori']} nominal={$t['nominal']} keterangan=\"{$t['keterangan']}\" oleh=\"{$t['oleh']}\" -> ditemukan {$rows->count()} baris\n";
    if ($rows->count() < 2) {
        echo "  (dilewati, tidak ada duplikat)\n\n";
        continue;
    }
    $keep = $rows->first();
    echo "  KEEP id={$keep->id}\n";
    foreach ($rows->skip(1) as $dup) {
        echo "  DELETE id={$dup->id}\n";
        $idsToDelete[] = $dup->id;
    }
    echo "\n";
}

sort($idsToDelete);
echo "=================================================================\n";
echo "Total baris yang akan dihapus: " . count($idsToDelete) . "\n";
echo "=================================================================\n\n";

echo "-- LANGKAH 1: Verifikasi\n";
echo "SELECT id, projek_kerja_id, kategori, nominal, keterangan, oleh, item_created_at\n";
echo "FROM projek_kerja_biayas\n";
echo "WHERE id IN (" . implode(',', $idsToDelete) . ")\n";
echo "ORDER BY projek_kerja_id, keterangan;\n\n";

echo "-- LANGKAH 2: Hapus\n";
echo "DELETE FROM projek_kerja_biayas\n";
echo "WHERE id IN (" . implode(',', $idsToDelete) . ");\n";
