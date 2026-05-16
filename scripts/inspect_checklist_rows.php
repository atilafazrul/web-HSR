<?php

require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

$type = $argv[1] ?? 'realisasi';
$path = dirname(__DIR__) . "/storage/app/private/templates/work_checklist_{$type}.xlsx";
$s = IOFactory::load($path)->getSheet(0);

for ($r = 35; $r <= 90; $r++) {
    $c = trim((string) $s->getCell("C{$r}")->getFormattedValue());
    $d = trim((string) $s->getCell("D{$r}")->getFormattedValue());
    $h = trim((string) $s->getCell("H{$r}")->getValue());
    $m = trim((string) $s->getCell("M{$r}")->getFormattedValue());
    if ($h !== '' || $c !== '') {
        $hOne = str_replace(["\r\n", "\n"], ' | ', substr($h, 0, 70));
        echo "{$r}\tC={$c}\tD={$d}\tM={$m}\tH={$hOne}\n";
    }
}
