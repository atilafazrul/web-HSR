<?php

namespace App\Http\Controllers;

use App\Models\WorkChecklistDraft;
use App\Services\WorkChecklistStructureBuilder;
use App\Support\ChecklistDompdfWriter;
use Carbon\Carbon;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\RichText\RichText;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class WorkChecklistController extends Controller
{
    private const FONT_BODY = 12;

    private const FONT_HEADER = 16;

    private const FONT_CHECKMARK = 18;

    private const FONT_FOOTER_LABEL = 14;

    private const FONT_FOOTER_COMPANY = 14;

    protected function templatePath(string $type): string
    {
        return storage_path("app/private/templates/work_checklist_{$type}.xlsx");
    }

    protected function structurePath(string $type): string
    {
        return storage_path("app/private/templates/checklist_{$type}.json");
    }

    /**
     * Baris checklist yang perlu dikosongkan sebelum isi data form.
     *
     * @return int[]
     */
    protected function collectClearableRows(string $type): array
    {
        $path = $this->structurePath($type);
        if (!file_exists($path)) {
            $max = $type === 'planning' ? 146 : 94;

            return range(36, $max);
        }

        $data = json_decode(file_get_contents($path), true);
        $rows = [];

        if ($type === 'realisasi') {
            foreach ($data['groups'] ?? [] as $group) {
                foreach ($group['activities'] ?? [] as $activity) {
                    $rows[] = (int) $activity['row'];
                }
            }
        } else {
            foreach ($data['items'] ?? [] as $item) {
                $rows[] = (int) $item['row'];
            }
        }

        return array_values(array_unique(array_filter($rows)));
    }

    /**
     * Baris checklist yang merupakan section header (sesuai struktur JSON).
     * Section header tidak punya kotak centang.
     *
     * @return int[]
     */
    protected function collectSectionRows(string $type): array
    {
        $path = $this->structurePath($type);
        if (!file_exists($path)) {
            return [];
        }
        $data = json_decode(file_get_contents($path), true);
        $rows = [];
        foreach ($data['items'] ?? [] as $item) {
            if (!empty($item['is_section'])) {
                $rows[] = (int) $item['row'];
            }
        }

        return $rows;
    }

    protected function clearChecklistRowCells(Worksheet $sheet, int $row): void
    {
        foreach (['C', 'D', 'E', 'H', 'M', 'N', 'O'] as $col) {
            $coord = "{$col}{$row}";
            $sheet->setCellValue($coord, '');
            // Bersihkan juga fill abu-abu dan format bold dari template
            // supaya baris kosong benar-benar bersih (tidak ada section divider sisa).
            $style = $sheet->getStyle($coord);
            $style->getFill()->setFillType(Fill::FILL_NONE);
            $style->getFont()->setBold(false);
        }
    }

    /**
     * Bersihkan hanya kolom centang (M & N) dan kembalikan ke simbol kotak kosong '□'.
     * Dipakai untuk baris-baris template Planning yang labelnya berasal dari Excel.
     */
    protected function clearChecklistCheckCells(Worksheet $sheet, int $row): void
    {
        foreach (['M', 'N'] as $col) {
            $coord = "{$col}{$row}";
            $sheet->setCellValue($coord, '□');
            $style = $sheet->getStyle($coord);
            $style->getFont()->setSize(self::FONT_CHECKMARK);
            $style->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_CENTER);
        }
    }

    protected function setTextCell(
        Worksheet $sheet,
        string $coord,
        mixed $value,
        int $fontSize = self::FONT_BODY,
        bool $bold = false,
        bool $wrap = false,
        string $horizontal = Alignment::HORIZONTAL_LEFT
    ): void {
        $sheet->setCellValue($coord, $value);
        $style = $sheet->getStyle($coord);
        $style->getFont()->setSize($fontSize)->setBold($bold);
        $align = $style->getAlignment();
        $align->setHorizontal($horizontal);
        if ($wrap) {
            $align->setWrapText(true)->setVertical(Alignment::VERTICAL_TOP);
        }
    }

    /** Label biasa, nilai input tebal (satu sel). */
    protected function setLabeledInputCell(
        Worksheet $sheet,
        string $coord,
        string $label,
        string $value,
        int $fontSize = self::FONT_HEADER,
        bool $wrap = false
    ): void {
        $value = trim($value);
        if ($value === '') {
            return;
        }

        $rich = new RichText();
        $labelRun = $rich->createTextRun($label);
        $labelRun->getFont()->setSize($fontSize)->setBold(false);

        $valueRun = $rich->createTextRun($value);
        $valueRun->getFont()->setSize($fontSize)->setBold(true);

        $sheet->setCellValue($coord, $rich);
        $align = $sheet->getStyle($coord)->getAlignment();
        $align->setVertical(Alignment::VERTICAL_CENTER);
        if ($wrap) {
            $align->setWrapText(true)->setVertical(Alignment::VERTICAL_TOP);
        }
    }

    protected function applyCheckmark(Worksheet $sheet, string $col, int $row): void
    {
        $coord = "{$col}{$row}";
        // ☑ = kotak dengan centang, agar tampilan sama rapinya dengan template
        // yang sudah punya simbol □ (kotak kosong) di setiap baris.
        $sheet->setCellValue($coord, '☑');
        $style = $sheet->getStyle($coord);
        $style->getFont()->setSize(self::FONT_CHECKMARK)->setBold(true);
        $style->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setVertical(Alignment::VERTICAL_CENTER);
    }

    protected function clearCheckmark(Worksheet $sheet, string $col, int $row): void
    {
        $sheet->setCellValue("{$col}{$row}", '');
    }

    /** @return array{company_row: int, signature_row: int, label_row: int} */
    protected function footerConfig(string $type): array
    {
        return $type === 'planning'
            ? ['company_row' => 164, 'signature_row' => 162, 'label_row' => 151]
            : ['company_row' => 110, 'signature_row' => 108, 'label_row' => 97];
    }

    /** Kosongkan blok informasi umum (header) dari template. */
    protected function clearHeaderSection(Worksheet $sheet): void
    {
        $sheet->setCellValue('I15', '');
        $sheet->setCellValue('C16', '');
        $sheet->setCellValue('C19', '');
        $sheet->setCellValue('C21', '');
        $sheet->setCellValue('C23', '');
        $sheet->setCellValue('C26', '');
    }

    protected function applyHeaderSection(Worksheet $sheet, array $validated): void
    {
        if (!empty($validated['minggu_ke'])) {
            $this->setTextCell($sheet, 'I15', $validated['minggu_ke'], self::FONT_HEADER, true);
        }

        if (!empty($validated['site'])) {
            $this->setTextCell($sheet, 'C16', $validated['site'], self::FONT_HEADER, true);
        }

        $this->setLabeledInputCell($sheet, 'C19', 'PEMBERI TUGAS : ', $validated['pemberi_tugas'] ?? '');
        $this->setLabeledInputCell($sheet, 'C21', 'PENGAWAS : ', $validated['pengawas'] ?? '');
        $this->setLabeledInputCell($sheet, 'C23', 'SUB KONTRAKTOR : ', $validated['sub_kontraktor'] ?? '');

        $this->applyCatatan($sheet, $validated);
    }

    /**
     * Untuk Planning, isi blok NO + MINGGU KE + TANGGAL (kolom C, D, E di baris 38-40).
     * Kolom E (TANGGAL) menempati 3 baris: tanggal mulai, "s.d", tanggal selesai.
     */
    protected function applyPlanningBodyHeader(Worksheet $sheet, array $validated): void
    {
        $nomorUrut = trim((string) ($validated['nomor_urut'] ?? ''));
        $minggu = trim((string) ($validated['minggu_ke'] ?? ''));
        $tglMulai = trim((string) ($validated['tanggal_mulai'] ?? ''));
        $tglSelesai = trim((string) ($validated['tanggal_selesai'] ?? ''));

        if ($nomorUrut !== '') {
            $this->setTextCell(
                $sheet,
                'C38',
                $nomorUrut,
                self::FONT_BODY,
                true,
                false,
                Alignment::HORIZONTAL_CENTER
            );
        }

        if ($minggu !== '') {
            $this->setTextCell(
                $sheet,
                'D38',
                $minggu,
                self::FONT_BODY,
                true,
                false,
                Alignment::HORIZONTAL_CENTER
            );
        }

        if ($tglMulai !== '') {
            try {
                $sheet->setCellValue('E38', ExcelDate::PHPToExcel(Carbon::parse($tglMulai)));
                $style = $sheet->getStyle('E38');
                $style->getFont()->setSize(self::FONT_BODY)->setBold(true);
                $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $style->getNumberFormat()->setFormatCode('dddd, dd mmmm yyyy');
            } catch (\Throwable $e) {
                // ignore
            }
        }

        if ($tglMulai !== '' && $tglSelesai !== '') {
            $this->setTextCell(
                $sheet,
                'E39',
                's.d',
                self::FONT_BODY,
                false,
                false,
                Alignment::HORIZONTAL_CENTER
            );
        }

        if ($tglSelesai !== '') {
            try {
                $sheet->setCellValue('E40', ExcelDate::PHPToExcel(Carbon::parse($tglSelesai)));
                $style = $sheet->getStyle('E40');
                $style->getFont()->setSize(self::FONT_BODY)->setBold(true);
                $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $style->getNumberFormat()->setFormatCode('dddd, dd mmmm yyyy');
            } catch (\Throwable $e) {
                // ignore
            }
        }
    }

    protected function applyCatatan(Worksheet $sheet, array $validated): void
    {
        $catatan = trim($validated['catatan'] ?? '');
        if ($catatan !== '') {
            $this->setLabeledInputCell($sheet, 'C26', 'CATATAN : ', $catatan, self::FONT_BODY, true);
        } else {
            $this->setTextCell($sheet, 'C26', 'CATATAN :', self::FONT_BODY, false, true);
        }
    }

    /** Kosongkan baris tambahan template sebelum blok tanda tangan. */
    protected function clearExtraBodyRows(Worksheet $sheet, string $type): void
    {
        $cfg = $this->footerConfig($type);
        $from = $type === 'planning' ? 147 : 80;

        for ($row = $from; $row < $cfg['label_row']; $row++) {
            $this->clearChecklistRowCells($sheet, $row);
        }
    }

    protected function clearFooterSection(Worksheet $sheet, string $type): void
    {
        $cfg = $this->footerConfig($type);

        foreach (['C', 'H', 'M'] as $col) {
            $sheet->setCellValue("{$col}{$cfg['company_row']}", '');
            $sheet->setCellValue("{$col}{$cfg['signature_row']}", '');
        }
    }

    protected function restoreFooterLabels(Worksheet $sheet, string $type): void
    {
        $labelRow = $this->footerConfig($type)['label_row'];
        $labels = [
            'C' => 'Dibuat Oleh,',
            'H' => 'Diawasi Oleh,',
            'M' => 'Disetujui Oleh,',
        ];

        foreach ($labels as $col => $text) {
            $coord = "{$col}{$labelRow}";
            $sheet->setCellValue($coord, $text);
            $style = $sheet->getStyle($coord);
            $style->getFont()->setItalic(true)->setSize(self::FONT_FOOTER_LABEL);
            $style->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }
    }

    /**
     * Footer tanda tangan: Sub Kontraktor | Pengawas | Pemberi Tugas (+ nama penandatangan opsional).
     */
    protected function applyFooterSection(Worksheet $sheet, array $validated, string $type): void
    {
        $cfg = $this->footerConfig($type);
        $companyRow = $cfg['company_row'];
        $signatureRow = $cfg['signature_row'];

        $this->restoreFooterLabels($sheet, $type);

        if (!empty($validated['sub_kontraktor'])) {
            $this->setTextCell(
                $sheet,
                "C{$companyRow}",
                $validated['sub_kontraktor'],
                self::FONT_FOOTER_COMPANY,
                true,
                false,
                Alignment::HORIZONTAL_CENTER
            );
        }

        if (!empty($validated['pengawas'])) {
            $this->setTextCell(
                $sheet,
                "H{$companyRow}",
                $validated['pengawas'],
                self::FONT_FOOTER_COMPANY,
                true,
                false,
                Alignment::HORIZONTAL_CENTER
            );
        }

        if (!empty($validated['pemberi_tugas'])) {
            $this->setTextCell(
                $sheet,
                "M{$companyRow}",
                $validated['pemberi_tugas'],
                self::FONT_FOOTER_COMPANY,
                true,
                false,
                Alignment::HORIZONTAL_CENTER
            );
        }

        if (!empty($validated['dibuat_oleh'])) {
            $this->setTextCell(
                $sheet,
                "C{$signatureRow}",
                $validated['dibuat_oleh'],
                self::FONT_BODY,
                false,
                false,
                Alignment::HORIZONTAL_CENTER
            );
        }

        if (!empty($validated['disetujui_oleh'])) {
            $this->setTextCell(
                $sheet,
                "M{$signatureRow}",
                $validated['disetujui_oleh'],
                self::FONT_BODY,
                false,
                false,
                Alignment::HORIZONTAL_CENTER
            );
        }
    }

    /**
     * GET /work-checklist/structure?type=planning|realisasi
     */
    public function structure(Request $request, WorkChecklistStructureBuilder $builder)
    {
        $type = $request->query('type', 'planning');
        if (!in_array($type, ['planning', 'realisasi'], true)) {
            return response()->json(['success' => false, 'message' => 'Tipe tidak valid.'], 422);
        }

        $data = $builder->loadOrBuild($type);
        if ($data === null) {
            $template = $builder->templatePath($type);

            return response()->json([
                'success' => false,
                'message' => 'Template work checklist belum tersedia di server. '
                    . 'Letakkan file Excel di: storage/app/private/templates/work_checklist_'
                    . $type
                    . '.xlsx (saat ini: '
                    . (file_exists($template) ? 'ada' : 'tidak ada')
                    . ').',
            ], 503);
        }

        return response()->json([
            'success' => true,
            'type' => $type,
            'layout' => $data['layout'] ?? 'rows',
            'sheet' => $data['sheet'] ?? 'WEEK 1',
            'items' => $data['items'] ?? [],
            'groups' => $data['groups'] ?? [],
        ]);
    }

    /**
     * GET /work-checklist/drafts?type=planning|realisasi
     */
    public function indexDrafts(Request $request)
    {
        $type = $request->query('type', 'planning');
        if (!in_array($type, ['planning', 'realisasi'], true)) {
            return response()->json(['success' => false, 'message' => 'Tipe tidak valid.'], 422);
        }

        $drafts = WorkChecklistDraft::query()
            ->where('user_id', $request->user()->id)
            ->where('type', $type)
            ->orderByDesc('updated_at')
            ->get(['id', 'type', 'title', 'updated_at', 'created_at']);

        return response()->json(['success' => true, 'drafts' => $drafts]);
    }

    /**
     * GET /work-checklist/drafts/{draft}
     */
    public function showDraft(Request $request, WorkChecklistDraft $draft)
    {
        if ($draft->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        return response()->json([
            'success' => true,
            'draft' => [
                'id' => $draft->id,
                'type' => $draft->type,
                'title' => $draft->title,
                'payload' => $draft->payload,
                'updated_at' => $draft->updated_at,
            ],
        ]);
    }

    /**
     * POST /work-checklist/drafts
     */
    public function storeDraft(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:planning,realisasi',
            'title' => 'nullable|string|max:255',
            'payload' => 'required|array',
        ]);

        $title = trim($validated['title'] ?? '') ?: $this->defaultDraftTitle($validated['type'], $validated['payload']);

        $draft = WorkChecklistDraft::create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'title' => $title,
            'payload' => $validated['payload'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Checklist berhasil disimpan.',
            'draft' => $draft->only(['id', 'type', 'title', 'updated_at']),
        ], 201);
    }

    /**
     * PUT /work-checklist/drafts/{draft}
     */
    public function updateDraft(Request $request, WorkChecklistDraft $draft)
    {
        if ($draft->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'payload' => 'required|array',
        ]);

        if (array_key_exists('title', $validated) && trim($validated['title'] ?? '') !== '') {
            $draft->title = trim($validated['title']);
        }
        $draft->payload = $validated['payload'];
        $draft->save();

        return response()->json([
            'success' => true,
            'message' => 'Checklist berhasil diperbarui.',
            'draft' => $draft->only(['id', 'type', 'title', 'updated_at']),
        ]);
    }

    /**
     * DELETE /work-checklist/drafts/{draft}
     */
    public function destroyDraft(Request $request, WorkChecklistDraft $draft)
    {
        if ($draft->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $draft->delete();

        return response()->json([
            'success' => true,
            'message' => 'Checklist berhasil dihapus.',
        ]);
    }

    protected function defaultDraftTitle(string $type, array $payload): string
    {
        $header = $payload['header'] ?? [];
        $site = trim($header['site'] ?? '');
        $minggu = trim($header['minggu_ke'] ?? '');
        $parts = array_filter([
            strtoupper($type),
            $site !== '' ? $site : null,
            $minggu !== '' ? 'Minggu ' . $minggu : null,
        ]);

        return implode(' · ', $parts) ?: 'Checklist ' . now()->format('d/m/Y H:i');
    }

    /**
     * POST /work-checklist/generate
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:planning,realisasi',
            'format' => 'required|in:xlsx,pdf',
            'minggu_ke' => 'nullable|string|max:20',
            'site' => 'nullable|string|max:255',
            'pemberi_tugas' => 'nullable|string|max:255',
            'pengawas' => 'nullable|string|max:255',
            'sub_kontraktor' => 'nullable|string|max:255',
            'catatan' => 'nullable|string|max:5000',
            'dibuat_oleh' => 'nullable|string|max:255',
            'disetujui_oleh' => 'nullable|string|max:255',
            'nomor_urut' => 'nullable|string|max:20',
            'tanggal_mulai' => 'nullable|date',
            'tanggal_selesai' => 'nullable|date',
            'items' => 'nullable|array',
            'items.*.row' => 'required|integer|min:1',
            'items.*.sesuai' => 'nullable|boolean',
            'items.*.tidak_sesuai' => 'nullable|boolean',
            'items.*.paraf' => 'nullable|string|max:120',
            'items.*.tanggal' => 'nullable|date',
            'items.*.tanggal_sampai' => 'nullable|date',
            'items.*.nama_kegiatan' => 'nullable|string|max:500',
            'items.*.col_c' => 'nullable|string|max:10',
            'items.*.col_d' => 'nullable|string|max:10',
            'custom_items' => 'nullable|array',
            'custom_items.*.nama_kegiatan' => 'required|string|max:500',
            'custom_items.*.sesuai' => 'nullable|boolean',
            'custom_items.*.tidak_sesuai' => 'nullable|boolean',
            'custom_items.*.paraf' => 'nullable|string|max:120',
            'custom_items.*.tanggal' => 'nullable|date',
            'custom_items.*.is_section' => 'nullable|boolean',
        ]);

        $type = $validated['type'];
        $template = $this->templatePath($type);

        if (!file_exists($template)) {
            return response()->json([
                'success' => false,
                'message' => 'Template checklist tidak ditemukan di server.',
            ], 500);
        }

        try {
            $spreadsheet = IOFactory::load($template);
            $this->fillSpreadsheet($spreadsheet, $validated, $type);

            $stamp = Carbon::now()->format('Ymd_His');
            $baseName = 'WorkChecklist_' . ucfirst($type) . '_Week1_' . $stamp;

            if ($validated['format'] === 'pdf') {
                return $this->downloadChecklistPdf($spreadsheet, $baseName, $type);
            }

            return $this->downloadChecklistXlsx($spreadsheet, $baseName);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Gagal generate file: ' . $e->getMessage(),
            ], 500);
        }
    }

    protected function fillSpreadsheet(Spreadsheet $spreadsheet, array $validated, string $type): void
    {
        $sheet = $spreadsheet->getSheet(0);

        $this->clearHeaderSection($sheet);
        $this->clearFooterSection($sheet, $type);

        $footerCfg = $this->footerConfig($type);
        $sectionRows = $this->collectSectionRows($type);

        if ($type === 'planning') {
            foreach ($this->collectClearableRows($type) as $clearRow) {
                // Jaga struktur template: kosongkan hanya kolom centang + paraf + tanggal,
                // jangan hapus label/garis dari Excel.
                if (in_array($clearRow, $sectionRows, true)) {
                    $sheet->setCellValue("M{$clearRow}", '');
                    $sheet->setCellValue("N{$clearRow}", '');
                } else {
                    $this->clearChecklistCheckCells($sheet, $clearRow);
                }
                $sheet->setCellValue("O{$clearRow}", '');
                $sheet->setCellValue("E{$clearRow}", '');
            }
        } else {
            foreach ($this->collectClearableRows($type) as $clearRow) {
                $this->clearChecklistRowCells($sheet, $clearRow);
            }

            $this->clearExtraBodyRows($sheet, $type);

            $customStart = 95;
            $customEnd = $footerCfg['label_row'] - 1;
            for ($clearRow = $customStart; $clearRow <= $customEnd; $clearRow++) {
                $this->clearChecklistRowCells($sheet, $clearRow);
            }
        }

        $this->applyHeaderSection($sheet, $validated);

        if ($type === 'planning') {
            $this->applyPlanningBodyHeader($sheet, $validated);
        }

        foreach ($validated['items'] ?? [] as $item) {
            $row = (int) $item['row'];
            if ($row < 1) {
                continue;
            }

            if (!empty($item['nama_kegiatan'])) {
                $this->setTextCell($sheet, "H{$row}", $item['nama_kegiatan'], self::FONT_BODY, false, true);
            }

            if (!empty($item['col_c'])) {
                $this->setTextCell(
                    $sheet,
                    "C{$row}",
                    $item['col_c'],
                    self::FONT_BODY,
                    false,
                    false,
                    Alignment::HORIZONTAL_CENTER
                );
            }

            if (!empty($item['col_d'])) {
                $this->setTextCell(
                    $sheet,
                    "D{$row}",
                    $item['col_d'],
                    self::FONT_BODY,
                    false,
                    false,
                    Alignment::HORIZONTAL_CENTER
                );
            }

            if (!empty($item['tanggal'])) {
                try {
                    $coord = "E{$row}";
                    $sheet->setCellValue(
                        $coord,
                        ExcelDate::PHPToExcel(Carbon::parse($item['tanggal']))
                    );
                    $sheet->getStyle($coord)->getFont()->setSize(self::FONT_BODY);
                    $sheet->getStyle($coord)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                } catch (\Throwable $e) {
                    // ignore invalid date
                }
            }

            if (!empty($item['sesuai'])) {
                $this->applyCheckmark($sheet, 'M', $row);
                $this->clearCheckmark($sheet, 'N', $row);
            }

            if (!empty($item['tidak_sesuai'])) {
                $this->applyCheckmark($sheet, 'N', $row);
                $this->clearCheckmark($sheet, 'M', $row);
            }
        }

        if ($type !== 'planning') {
            $nextRow = 95;
            foreach ($validated['custom_items'] ?? [] as $custom) {
                $isSection = !empty($custom['is_section']);

                if ($isSection) {
                    // Baris section header: label tebal, latar abu-abu, tanpa centang/paraf/tanggal
                    $coord = "H{$nextRow}";
                    $sheet->setCellValue($coord, $custom['nama_kegiatan']);
                    $style = $sheet->getStyle($coord);
                    $style->getFont()->setSize(self::FONT_BODY)->setBold(true);
                    $style->getAlignment()
                        ->setHorizontal(Alignment::HORIZONTAL_LEFT)
                        ->setVertical(Alignment::VERTICAL_CENTER)
                        ->setWrapText(true);
                    $style->getFill()
                        ->setFillType(Fill::FILL_SOLID)
                        ->getStartColor()->setRGB('D9D9D9');

                    // Kosongkan kotak centang di kolom M/N untuk baris section
                    $sheet->setCellValue("M{$nextRow}", '');
                    $sheet->setCellValue("N{$nextRow}", '');

                    $nextRow++;
                    continue;
                }

                $this->setTextCell($sheet, "H{$nextRow}", $custom['nama_kegiatan'], self::FONT_BODY, false, true);

                if (!empty($custom['tanggal'])) {
                    try {
                        $coord = "E{$nextRow}";
                        $sheet->setCellValue(
                            $coord,
                            ExcelDate::PHPToExcel(Carbon::parse($custom['tanggal']))
                        );
                        $sheet->getStyle($coord)->getFont()->setSize(self::FONT_BODY);
                        $sheet->getStyle($coord)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                    } catch (\Throwable $e) {
                        // ignore
                    }
                }

                if (!empty($custom['sesuai'])) {
                    $this->applyCheckmark($sheet, 'M', $nextRow);
                }

                if (!empty($custom['tidak_sesuai'])) {
                    $this->applyCheckmark($sheet, 'N', $nextRow);
                }

                if (!empty($custom['paraf'])) {
                    $this->setTextCell($sheet, "O{$nextRow}", $custom['paraf'], self::FONT_BODY);
                }

                $nextRow++;
            }

            // Bersihkan border + fill di baris kosong setelah entri user
            // agar area di bawah data tampak seperti kertas putih (tidak ada garis-garis).
            $clearStart = $nextRow;
            $clearEnd = $footerCfg['label_row'] - 1;
            for ($r = $clearStart; $r <= $clearEnd; $r++) {
                foreach (['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'] as $col) {
                    $style = $sheet->getStyle("{$col}{$r}");
                    $borders = $style->getBorders();
                    $borders->getTop()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_NONE);
                    $borders->getBottom()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_NONE);
                    $borders->getLeft()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_NONE);
                    $borders->getRight()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_NONE);
                    $style->getFill()->setFillType(Fill::FILL_NONE);
                }
            }
        }

        // Reset indikator page break manual & set print area menyesuaikan area data + footer
        // supaya tidak muncul garis putus-putus di Excel saat view normal.
        $sheet->setBreak('A1', Worksheet::BREAK_NONE);
        $sheet->getRowBreaks(); // touch for safety
        $rowBreaks = $sheet->getRowBreaks();
        foreach (array_keys($rowBreaks) as $breakCell) {
            $sheet->setBreak($breakCell, Worksheet::BREAK_NONE);
        }
        $colBreaks = $sheet->getColumnBreaks();
        foreach (array_keys($colBreaks) as $breakCell) {
            $sheet->setBreak($breakCell, Worksheet::BREAK_NONE);
        }

        // Pastikan seluruh konten masuk dalam 1 page width agar tidak muncul indikator
        // pemotongan halaman otomatis di view normal Excel.
        $pageSetup = $sheet->getPageSetup();
        $pageSetup->setFitToPage(true);
        $pageSetup->setFitToWidth(1);
        $pageSetup->setFitToHeight(0);
        // Kembalikan view ke Normal agar tidak menonjolkan garis break.
        $sheet->getSheetView()->setView(\PhpOffice\PhpSpreadsheet\Worksheet\SheetView::SHEETVIEW_NORMAL);

        $this->applyFooterSection($sheet, $validated, $type);

        $label = strtoupper($type === 'planning' ? 'PLANNING' : 'REALISASI');
        $sheet->setCellValue('K17', $label);
    }

    protected function downloadChecklistXlsx(Spreadsheet $spreadsheet, string $baseName)
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'checklist_') . '.xlsx';
        (new Xlsx($spreadsheet))->save($tempFile);

        return response()->download($tempFile, "{$baseName}.xlsx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    protected function downloadChecklistPdf(Spreadsheet $spreadsheet, string $baseName, string $type)
    {
        $this->prepareSpreadsheetForPdfExport($spreadsheet, $type);

        $tempXlsx = tempnam(sys_get_temp_dir(), 'checklist_') . '.xlsx';
        $tempPdf = tempnam(sys_get_temp_dir(), 'checklist_') . '.pdf';

        try {
            (new Xlsx($spreadsheet))->save($tempXlsx);

            if ($this->convertXlsxToPdfWithExcel($tempXlsx, $tempPdf)) {
                return $this->pdfDownloadResponse($tempPdf, $baseName);
            }

            if ($this->convertXlsxToPdfWithLibreOffice($tempXlsx, $tempPdf)) {
                return $this->pdfDownloadResponse($tempPdf, $baseName);
            }

            $drawingDir = $this->materializeDrawingsForPdf($spreadsheet);

            try {
                $writer = new ChecklistDompdfWriter($spreadsheet);
                $writer->setEmbedImages(true);
                $writer->setUseInlineCss(true);
                $writer->setGenerateSheetNavigationBlock(false);
                $writer->setPreCalculateFormulas(false);
                $writer->setImagesRoot('');
                $writer->save($tempPdf);
            } finally {
                $this->cleanupDrawingTempDir($drawingDir);
            }

            return $this->pdfDownloadResponse($tempPdf, $baseName);
        } finally {
            if (file_exists($tempXlsx)) {
                @unlink($tempXlsx);
            }
        }
    }

    /**
     * Extract embedded xlsx images to real files so Dompdf can embed them (avoids broken "data:,").
     */
    protected function materializeDrawingsForPdf(Spreadsheet $spreadsheet): ?string
    {
        $dir = storage_path('app/temp/checklist-drawings/' . uniqid('pdf_', true));
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            return null;
        }

        $hasDrawings = false;
        foreach ($spreadsheet->getAllSheets() as $sheetIndex => $sheet) {
            $i = 0;
            foreach ($sheet->getDrawingCollection() as $drawing) {
                if (!$drawing instanceof Drawing) {
                    continue;
                }

                $zipPath = $drawing->getPath();
                if ($zipPath === '') {
                    continue;
                }

                $ext = strtolower($drawing->getExtension() ?: 'png');
                $target = $dir . DIRECTORY_SEPARATOR . "sheet{$sheetIndex}_{$i}.{$ext}";
                $i++;

                $contents = @file_get_contents($zipPath);
                if ($contents === false) {
                    continue;
                }

                file_put_contents($target, $contents);
                $drawing->setPath($target);
                $hasDrawings = true;
            }
        }

        return $hasDrawings ? $dir : null;
    }

    protected function cleanupDrawingTempDir(?string $dir): void
    {
        if ($dir === null || !is_dir($dir)) {
            return;
        }

        foreach (glob($dir . DIRECTORY_SEPARATOR . '*') ?: [] as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
        @rmdir($dir);
    }

    /**
     * Keep template print layout (portrait A4, print area, scale) — do not force landscape.
     */
    protected function prepareSpreadsheetForPdfExport(Spreadsheet $spreadsheet, string $type): void
    {
        $sheet = $spreadsheet->getSheet(0);
        $setup = $sheet->getPageSetup();

        $setup->setOrientation(PageSetup::ORIENTATION_PORTRAIT);
        $setup->setPaperSize(PageSetup::PAPERSIZE_A4);
        $setup->setFitToPage(false);

        if (!$setup->getPrintArea()) {
            $setup->setPrintArea($type === 'planning' ? 'C4:O170' : 'C4:O116');
        }

        if ($setup->getScale() <= 0) {
            $setup->setScale(41);
        }
    }

    /**
     * Convert via LibreOffice headless (best match to Excel when installed).
     */
    protected function convertXlsxToPdfWithLibreOffice(string $xlsxPath, string $pdfPath): bool
    {
        $candidates = array_filter([
            env('LIBREOFFICE_PATH'),
            'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
            'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
        ]);

        $xlsxPath = realpath($xlsxPath);
        if ($xlsxPath === false) {
            return false;
        }

        $outDir = dirname($pdfPath);
        $baseName = pathinfo($xlsxPath, PATHINFO_FILENAME);
        $expectedPdf = $outDir . DIRECTORY_SEPARATOR . $baseName . '.pdf';

        foreach ($candidates as $soffice) {
            if (!$soffice || !file_exists($soffice)) {
                continue;
            }

            $cmd = sprintf(
                '"%s" --headless --norestore --convert-to pdf --outdir "%s" "%s" 2>&1',
                $soffice,
                $outDir,
                $xlsxPath
            );

            try {
                exec($cmd, $output, $code);
                if ($code === 0 && file_exists($expectedPdf) && filesize($expectedPdf) > 0) {
                    if (realpath($expectedPdf) !== realpath($pdfPath)) {
                        rename($expectedPdf, $pdfPath);
                    }

                    return true;
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return false;
    }

    /**
     * Use Microsoft Excel when available (Windows) for PDF that matches Excel output.
     */
    protected function convertXlsxToPdfWithExcel(string $xlsxPath, string $pdfPath): bool
    {
        if (PHP_OS_FAMILY !== 'Windows' || !class_exists('COM')) {
            return false;
        }

        $xlsxPath = realpath($xlsxPath);
        if ($xlsxPath === false || !file_exists($xlsxPath)) {
            return false;
        }

        $pdfPath = str_replace('/', '\\', $pdfPath);
        $excel = null;

        try {
            $excel = new \COM('Excel.Application');
            $excel->Visible = false;
            $excel->DisplayAlerts = false;
            $workbook = $excel->Workbooks->Open($xlsxPath);
            // xlTypePDF = 0, IgnorePrintAreas = false (respect template print area)
            $workbook->ExportAsFixedFormat(0, $pdfPath, 0, true, false);
            $workbook->Close(false);

            return file_exists($pdfPath) && filesize($pdfPath) > 0;
        } catch (\Throwable $e) {
            report($e);

            return false;
        } finally {
            if ($excel !== null) {
                try {
                    $excel->Quit();
                } catch (\Throwable $e) {
                    // ignore
                }
            }
            if (file_exists($pdfPath) && filesize($pdfPath) === 0) {
                @unlink($pdfPath);
            }
        }
    }

    protected function pdfDownloadResponse(string $tempPdf, string $baseName)
    {
        return response()->download($tempPdf, "{$baseName}.pdf", [
            'Content-Type' => 'application/pdf',
        ])->deleteFileAfterSend(true);
    }
}
