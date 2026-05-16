<?php

require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

$s = IOFactory::load(__DIR__ . '/../storage/app/private/templates/work_checklist_realisasi.xlsx')->getSheet(0);
for ($r = 97; $r <= 111; $r++) {
    foreach (['C', 'H', 'M', 'N', 'O'] as $col) {
        $v = trim((string) $s->getCell("{$col}{$r}")->getFormattedValue());
        if ($v !== '') echo "$col$r=$v\n";
    }
}
