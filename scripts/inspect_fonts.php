<?php

require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

$s = IOFactory::load(__DIR__ . '/../storage/app/private/templates/work_checklist_realisasi.xlsx')->getSheet(0);

foreach (['H36', 'H37', 'C26', 'C19', 'M36', 'C97', 'C110'] as $cell) {
    $f = $s->getStyle($cell)->getFont();
    echo "$cell size={$f->getSize()} bold=" . ($f->getBold() ? '1' : '0') . "\n";
}
