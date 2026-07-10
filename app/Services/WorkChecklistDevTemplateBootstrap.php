<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Minimal work checklist Excel templates for local development.
 * Production should use the real formatted templates from the team.
 */
class WorkChecklistDevTemplateBootstrap
{
    public function templatesDir(): string
    {
        return storage_path('app/private/templates');
    }

    public function bootstrapMissing(): void
    {
        $dir = $this->templatesDir();
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        foreach (['planning', 'realisasi'] as $type) {
            $path = $dir . "/work_checklist_{$type}.xlsx";
            if (!file_exists($path)) {
                $this->createTemplate($type, $path);
            }
        }
    }

    public function createTemplate(string $type, string $path): void
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('WEEK 1');

        $sheet->setCellValue('C16', 'SITE');
        $sheet->setCellValue('I15', 'MINGGU KE');

        if ($type === 'realisasi') {
            $sheet->setCellValue('C36', '1');
            $sheet->setCellValue('D36', '1');
            $sheet->setCellValue('E36', 'Senin');
            $sheet->setCellValue('H36', '- Pekerjaan minggu 1');
            $sheet->setCellValue('C37', '2');
            $sheet->setCellValue('D37', '1');
            $sheet->setCellValue('E37', 'Selasa');
            $sheet->setCellValue('H37', '- Pekerjaan lanjutan');
            $sheet->setCellValue('H97', 'Dibuat');
            $sheet->setCellValue('H108', 'Disetujui');
            $sheet->setCellValue('C110', 'PT. HAYATI SEMESTA RAHARJA');
        } else {
            $sheet->setCellValue('C38', 'NO');
            $sheet->setCellValue('D38', 'MINGGU');
            $sheet->setCellValue('E38', 'TANGGAL');

            $rows = [
                41 => 'PRELIMINARY',
                42 => '- Persiapan lokasi kerja',
                43 => '- Pengecekan material',
                44 => 'OT-INSTALLATION',
                45 => '- Instalasi peralatan utama',
                46 => '- Pengujian awal sistem',
            ];

            foreach ($rows as $row => $label) {
                $sheet->setCellValue("H{$row}", $label);
            }

            $sheet->setCellValue('H151', 'Dibuat');
            $sheet->setCellValue('H162', 'Disetujui');
            $sheet->setCellValue('C164', 'PT. HAYATI SEMESTA RAHARJA');
        }

        (new Xlsx($spreadsheet))->save($path);
    }
}
