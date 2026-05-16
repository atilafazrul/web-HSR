<?php

namespace App\Support;

use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Writer\Pdf\Dompdf as BaseDompdfWriter;

/**
 * Dompdf writer for checklist templates — strips broken image placeholders.
 */
class ChecklistDompdfWriter extends BaseDompdfWriter
{
    public function save($filename, int $flags = 0): void
    {
        $fileHandle = parent::prepareForSave($filename);

        $setup = $this->spreadsheet->getSheet($this->getSheetIndex() ?? 0)->getPageSetup();
        $orientation = $this->getOrientation() ?? $setup->getOrientation();
        $orientation = ($orientation === PageSetup::ORIENTATION_LANDSCAPE) ? 'L' : 'P';
        $printPaperSize = $this->getPaperSize() ?? $setup->getPaperSize();
        $paperSize = self::$paperSizes[$printPaperSize] ?? self::$paperSizes[PageSetup::getPaperSizeDefault()] ?? 'LETTER';
        if (is_array($paperSize) && count($paperSize) === 2) {
            $paperSize = [0.0, 0.0, $paperSize[0], $paperSize[1]];
        }
        $orientation = ($orientation === 'L') ? 'landscape' : 'portrait';

        $html = $this->sanitizePdfHtml($this->generateHTMLAll());

        $pdf = $this->createExternalWriterInstance();
        $pdf->setPaper($paperSize, $orientation);
        $pdf->loadHtml($html);
        $pdf->render();

        fwrite($fileHandle, $pdf->output());

        parent::restoreStateAfterSave();
    }

    protected function sanitizePdfHtml(string $html): string
    {
        $html = preg_replace('/<img\b[^>]*\bsrc=(["\'])data:,\\1[^>]*>/i', '', $html) ?? $html;
        $html = str_replace(['src="data:,"', "src='data:,'"], ['src=""', "src=''"], $html);

        return $html;
    }
}
