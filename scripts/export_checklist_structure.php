<?php

require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\IOFactory;

$base = dirname(__DIR__) . '/storage/app/private/templates';
$types = [
    'planning' => $base . '/work_checklist_planning.xlsx',
    'realisasi' => $base . '/work_checklist_realisasi.xlsx',
];

function shouldSkipLabel(string $label): bool
{
    return (bool) preg_match('/^(Dibuat|Disetujui|Diawasi|PT\.|Pasar kemis|No Tlp)/i', $label);
}

function isSectionLabel(string $label): bool
{
    return (bool) preg_match(
        '/^(PRELIMINARY|OT-|RADIOLOGY|MRI|CSSD|Demolition|Adaptation|VII|VI|V |IV |III |II |I$)/',
        $label
    ) && !str_starts_with($label, '-');
}

foreach ($types as $type => $path) {
    if (!file_exists($path)) {
        echo "Missing: $path\n";
        continue;
    }

    $wb = IOFactory::load($path);
    $sheet = $wb->getSheet(0);
    $maxRow = (int) $sheet->getHighestRow();

    if ($type === 'realisasi') {
        $groups = [];
        $current = null;

        for ($row = 36; $row <= $maxRow; $row++) {
            $label = trim((string) $sheet->getCell("H{$row}")->getFormattedValue());
            if ($label === '' || shouldSkipLabel($label)) {
                continue;
            }

            $colC = trim((string) $sheet->getCell("C{$row}")->getFormattedValue());
            $colD = trim((string) $sheet->getCell("D{$row}")->getFormattedValue());
            $colE = trim((string) $sheet->getCell("E{$row}")->getFormattedValue());
            $section = isSectionLabel($label);

            if ($colC !== '') {
                $current = [
                    'check_row' => $row,
                    'col_c' => $colC,
                    'col_d' => $colD,
                    'tanggal' => $colE,
                    'activities' => [],
                ];
                $groups[] = $current;
                $idx = count($groups) - 1;
            } elseif ($section && $colC === '') {
                $groups[] = [
                    'check_row' => null,
                    'col_c' => '',
                    'col_d' => '',
                    'tanggal' => '',
                    'is_section' => true,
                    'section_title' => $label,
                    'activities' => [],
                ];
                $idx = count($groups) - 1;
                $current = null;
            } elseif ($current !== null) {
                $idx = count($groups) - 1;
            } else {
                continue;
            }

            if (isset($idx)) {
                $groups[$idx]['activities'][] = [
                    'row' => $row,
                    'label' => $label,
                ];
            }
        }

        $out = [
            'type' => $type,
            'layout' => 'weekly',
            'sheet' => $sheet->getTitle(),
            'groups' => $groups,
        ];
    } else {
        $items = [];
        for ($row = 36; $row <= $maxRow; $row++) {
            $label = trim((string) $sheet->getCell("H{$row}")->getFormattedValue());
            if ($label === '' || shouldSkipLabel($label)) {
                continue;
            }

            $colC = trim((string) $sheet->getCell("C{$row}")->getFormattedValue());
            $colD = trim((string) $sheet->getCell("D{$row}")->getFormattedValue());

            $items[] = [
                'row' => $row,
                'label' => $label,
                'is_section' => isSectionLabel($label),
                'col_c' => $colC,
                'col_d' => $colD,
            ];
        }

        $out = [
            'type' => $type,
            'layout' => 'rows',
            'sheet' => $sheet->getTitle(),
            'items' => $items,
        ];
    }

    $jsonPath = $base . "/checklist_{$type}.json";
    file_put_contents($jsonPath, json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    $count = $type === 'realisasi' ? count($out['groups']) : count($out['items']);
    echo "{$type}: {$count} -> {$jsonPath}\n";
}
