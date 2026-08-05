<?php

namespace App\Services;

use App\Models\WorkChecklistStructure;
use PhpOffice\PhpSpreadsheet\IOFactory;

class WorkChecklistStructureBuilder
{
    public function templatePath(string $type): string
    {
        return storage_path("app/private/templates/work_checklist_{$type}.xlsx");
    }

    public function loadOrBuild(string $type): ?array
    {
        $existing = WorkChecklistStructure::where('type', $type)->first();
        if ($existing) {
            return is_array($existing->payload) ? $existing->payload : null;
        }

        if (!file_exists($this->templatePath($type)) && app()->environment('local')) {
            app(WorkChecklistDevTemplateBootstrap::class)->bootstrapMissing();
        }

        $built = $this->buildFromTemplate($type);
        if ($built === null && app()->environment('local')) {
            app(WorkChecklistDevTemplateBootstrap::class)->bootstrapMissing();
            $built = $this->buildFromTemplate($type);
        }

        if ($built === null) {
            return null;
        }

        WorkChecklistStructure::updateOrCreate(
            ['type' => $type],
            ['payload' => $built]
        );

        return $built;
    }

    public function buildFromTemplate(string $type): ?array
    {
        $path = $this->templatePath($type);
        if (!file_exists($path)) {
            return null;
        }

        $wb = IOFactory::load($path);
        $sheet = $wb->getSheet(0);
        $maxRow = (int) $sheet->getHighestRow();

        if ($type === 'realisasi') {
            $groups = [];
            $current = null;

            for ($row = 36; $row <= $maxRow; $row++) {
                $label = trim((string) $sheet->getCell("H{$row}")->getFormattedValue());
                if ($label === '' || $this->shouldSkipLabel($label)) {
                    continue;
                }

                $colC = trim((string) $sheet->getCell("C{$row}")->getFormattedValue());
                $colD = trim((string) $sheet->getCell("D{$row}")->getFormattedValue());
                $colE = trim((string) $sheet->getCell("E{$row}")->getFormattedValue());
                $section = $this->isSectionLabel($label);

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

            return [
                'type' => $type,
                'layout' => 'weekly',
                'sheet' => $sheet->getTitle(),
                'groups' => $groups,
            ];
        }

        $items = [];
        for ($row = 36; $row <= $maxRow; $row++) {
            $label = trim((string) $sheet->getCell("H{$row}")->getFormattedValue());
            if ($label === '' || $this->shouldSkipLabel($label)) {
                continue;
            }

            $colC = trim((string) $sheet->getCell("C{$row}")->getFormattedValue());
            $colD = trim((string) $sheet->getCell("D{$row}")->getFormattedValue());

            $items[] = [
                'row' => $row,
                'label' => $label,
                'is_section' => $this->isSectionLabel($label),
                'col_c' => $colC,
                'col_d' => $colD,
            ];
        }

        return [
            'type' => $type,
            'layout' => 'rows',
            'sheet' => $sheet->getTitle(),
            'items' => $items,
        ];
    }

    private function shouldSkipLabel(string $label): bool
    {
        return (bool) preg_match('/^(Dibuat|Disetujui|Diawasi|PT\.|Pasar kemis|No Tlp)/i', $label);
    }

    private function isSectionLabel(string $label): bool
    {
        return (bool) preg_match(
            '/^(PRELIMINARY|OT-|RADIOLOGY|MRI|CSSD|Demolition|Adaptation|VII|VI|V |IV |III |II |I$)/',
            $label
        ) && !str_starts_with($label, '-');
    }
}
