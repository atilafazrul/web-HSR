<?php

namespace App\Http\Controllers;

use App\Models\DailyReportDraft;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class DailyReportController extends Controller
{
    protected function resolvePublicImage(string ...$candidates): ?string
    {
        foreach ($candidates as $relative) {
            $path = public_path($relative);
            if (file_exists($path)) {
                return $path;
            }
        }

        return null;
    }

    protected function encodeLogo(?string $path): ?string
    {
        if (!$path || !file_exists($path)) {
            return null;
        }

        return 'data:image/png;base64,' . base64_encode(file_get_contents($path));
    }

    protected function buildPayload(array $validated): array
    {
        $tanggal = !empty($validated['tanggal'])
            ? Carbon::parse($validated['tanggal'])
            : Carbon::now();

        $hariTanggal = $tanggal->locale('id')->translatedFormat('l, d F Y');

        $informasi = $validated['informasi_kegiatan'] ?? [];
        $totalJam = 0;
        foreach ($informasi as $row) {
            $totalJam += (int) ($row['total_jam_kerja'] ?? 0);
        }

        $overtime = $validated['overtime'] ?? [];

        $grandTotal = (int) ($validated['total_keseluruhan_jam'] ?? 0);

        $kinerjaDefaults = config('hse_daily_report.kinerja_hse', []);
        $kinerjaInput = collect($validated['kinerja_hse'] ?? [])->keyBy('no');
        $kinerja = [];
        foreach ($kinerjaDefaults as $item) {
            $in = $kinerjaInput->get($item['no'], []);
            $kinerja[] = array_merge($item, [
                'tidak' => !empty($in['tidak']),
                'ya' => !empty($in['ya']),
                'keterangan' => $in['keterangan'] ?? '',
            ]);
        }

        $peralatan = $validated['peralatan'] ?? [];
        while (count($peralatan) < 10) {
            $peralatan[] = ['jenis' => '', 'jumlah' => '', 'waktu' => '', 'kondisi' => ''];
        }

        return array_merge($validated, [
            'hari_tanggal' => $validated['hari_tanggal'] ?? $hariTanggal,
            'informasi_kegiatan' => $informasi,
            'overtime' => array_merge([
                'pekerja' => '',
                'jam_kerja' => '',
                'total_jam_kerja' => '',
                'total_keseluruhan' => '',
                'keterangan' => '',
            ], $overtime),
            'total_jam_kerja' => $totalJam,
            'total_keseluruhan_jam' => $grandTotal,
            'kinerja_hse' => $kinerja,
            'peralatan' => array_slice($peralatan, 0, 15),
            'kondisi_cuaca_legend' => config('hse_daily_report.kondisi_cuaca', []),
            'logo_base64' => $this->encodeLogo($this->resolvePublicImage(
                'images/LOGO HSR.png',
                'images/logo-hsr.png',
            )),
            'logo_hse_base64' => $this->encodeLogo($this->resolvePublicImage(
                'images/LOGO HSE.png',
                'images/logo-hse.png',
                'images/LOGO K3.png',
            )),
        ]);
    }

    protected function normalizeInput(Request $request): void
    {
        $data = $request->all();

        foreach (['total_keseluruhan_jam'] as $key) {
            if (isset($data[$key]) && $data[$key] === '') {
                $data[$key] = null;
            }
        }

        if (!empty($data['informasi_kegiatan']) && is_array($data['informasi_kegiatan'])) {
            $data['informasi_kegiatan'] = array_values(array_map(function ($row) {
                return [
                    'lokasi' => $row['lokasi'] ?? '',
                    'pekerja' => (int) ($row['pekerja'] ?? 0),
                    'jam_kerja' => (int) ($row['jam_kerja'] ?? 0),
                    'total_jam_kerja' => (int) ($row['total_jam_kerja'] ?? 0),
                    'total_keseluruhan' => (int) ($row['total_keseluruhan'] ?? 0),
                    'keterangan' => $row['keterangan'] ?? '',
                ];
            }, $data['informasi_kegiatan']));
        }

        if (!empty($data['overtime']) && is_array($data['overtime'])) {
            $ot = $data['overtime'];
            $data['overtime'] = [
                'pekerja' => (int) ($ot['pekerja'] ?? 0),
                'jam_kerja' => (int) ($ot['jam_kerja'] ?? 0),
                'total_jam_kerja' => (int) ($ot['total_jam_kerja'] ?? 0),
                'total_keseluruhan' => (int) ($ot['total_keseluruhan'] ?? 0),
                'keterangan' => $ot['keterangan'] ?? '',
            ];
        }

        if (!empty($data['kinerja_hse']) && is_array($data['kinerja_hse'])) {
            $data['kinerja_hse'] = array_values(array_map(function ($row) {
                return [
                    'no' => (int) ($row['no'] ?? 0),
                    'tidak' => filter_var($row['tidak'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'ya' => filter_var($row['ya'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'keterangan' => $row['keterangan'] ?? '',
                ];
            }, $data['kinerja_hse']));
        }

        if (isset($data['total_keseluruhan_jam']) && $data['total_keseluruhan_jam'] !== null) {
            $data['total_keseluruhan_jam'] = (int) $data['total_keseluruhan_jam'];
        }

        $request->merge($data);
    }

    /**
     * POST /daily-report/generate
     */
    public function generate(Request $request)
    {
        $this->normalizeInput($request);

        $validated = $request->validate([
            'format' => 'required|in:pdf,xlsx',
            'document_no' => 'nullable|string|max:50',
            'rev' => 'nullable|string|max:20',
            'page' => 'nullable|string|max:20',
            'nama_pekerjaan' => 'nullable|string|max:500',
            'tanggal' => 'nullable|date',
            'hari_tanggal' => 'nullable|string|max:100',
            'area_lokasi' => 'nullable|string|max:500',
            'kegiatan' => 'nullable|string|max:500',
            'jam_kerja_hari' => 'nullable|string|max:50',
            'jam_kerja_kumulatif' => 'nullable|string|max:50',
            'informasi_kegiatan' => 'nullable|array|max:30',
            'informasi_kegiatan.*.lokasi' => 'nullable|string|max:255',
            'informasi_kegiatan.*.pekerja' => 'nullable|integer|min:0',
            'informasi_kegiatan.*.jam_kerja' => 'nullable|integer|min:0',
            'informasi_kegiatan.*.total_jam_kerja' => 'nullable|integer|min:0',
            'informasi_kegiatan.*.total_keseluruhan' => 'nullable|integer|min:0',
            'informasi_kegiatan.*.keterangan' => 'nullable|string|max:255',
            'overtime' => 'nullable|array',
            'overtime.pekerja' => 'nullable|integer|min:0',
            'overtime.jam_kerja' => 'nullable|integer|min:0',
            'overtime.total_jam_kerja' => 'nullable|integer|min:0',
            'overtime.total_keseluruhan' => 'nullable|integer|min:0',
            'overtime.keterangan' => 'nullable|string|max:255',
            'total_keseluruhan_jam' => 'nullable|integer|min:0',
            'kinerja_hse' => 'nullable|array|max:30',
            'kinerja_hse.*.no' => 'nullable|integer',
            'kinerja_hse.*.tidak' => 'nullable',
            'kinerja_hse.*.ya' => 'nullable',
            'kinerja_hse.*.keterangan' => 'nullable|string|max:255',
            'peralatan' => 'nullable|array|max:30',
            'peralatan.*.jenis' => 'nullable|string|max:255',
            'peralatan.*.jumlah' => 'nullable|string|max:50',
            'peralatan.*.waktu' => 'nullable|string|max:50',
            'peralatan.*.kondisi' => 'nullable|string|max:20',
            'jam_kerja_range' => 'nullable|string|max:100',
            'catatan_rekomendasi' => 'nullable|string|max:8000',
            'prepare_by' => 'nullable|string|max:255',
            'prepare_jabatan' => 'nullable|string|max:255',
            'checked_by' => 'nullable|string|max:255',
            'checked_jabatan' => 'nullable|string|max:255',
            'approved_by' => 'nullable|string|max:255',
            'approved_jabatan' => 'nullable|string|max:255',
        ]);

        try {
            $payload = $this->buildPayload($validated);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses data: ' . $e->getMessage(),
            ], 500);
        }

        $stamp = Carbon::now()->format('Ymd_His');
        $tanggalFile = !empty($validated['tanggal'])
            ? Carbon::parse($validated['tanggal'])->format('d_m_Y')
            : Carbon::now()->format('d_m_Y');
        $baseName = 'HSE_DailyReport_' . $tanggalFile . '_' . $stamp;

        try {
            if ($validated['format'] === 'xlsx') {
                return $this->downloadExcel($payload, $baseName);
            }

            return $this->downloadPdf($payload, $baseName);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Gagal generate file: ' . $e->getMessage(),
            ], 500);
        }
    }

    protected function downloadPdf(array $data, string $baseName)
    {
        $html = view('pdf.daily_report', $data)->render();

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return response()->make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $baseName . '.pdf"',
        ]);
    }

    protected function checkMark(bool $on): string
    {
        return $on ? '✓' : '';
    }

    protected function downloadExcel(array $data, string $baseName)
    {
        $sheet = new Spreadsheet();
        $ws = $sheet->getActiveSheet();
        $ws->setTitle('HSE Daily Report');

        $ws->setCellValue('A1', 'HSE DAILY REPORT');
        $ws->mergeCells('A1:I1');
        $ws->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $ws->getStyle('A1')->getFill()
            ->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('FFFF00');
        $ws->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $ws->setCellValue('A2', 'LAPORAN HARIAN HSE');
        $ws->mergeCells('A2:I2');
        $ws->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $meta = [
            ['Document No.', $data['document_no'] ?? 'DR-01-HSE 026', 'Rev.', $data['rev'] ?? '-', 'Page', $data['page'] ?? '1-3'],
            ['NAMA PEKERJAAN', $data['nama_pekerjaan'] ?? ''],
            ['HARI / TANGGAL', $data['hari_tanggal'] ?? ''],
            ['AREA / LOKASI', $data['area_lokasi'] ?? ''],
            ['KEGIATAN', $data['kegiatan'] ?? ''],
            ['Jam Kerja Hari ini', $data['jam_kerja_hari'] ?? ''],
            ['Jam Kerja Kumulatif', $data['jam_kerja_kumulatif'] ?? ''],
        ];

        $r = 4;
        foreach ($meta as $row) {
            if (count($row) === 6) {
                $ws->setCellValue("A{$r}", $row[0]);
                $ws->setCellValue("B{$r}", $row[1]);
                $ws->setCellValue("D{$r}", $row[2]);
                $ws->setCellValue("E{$r}", $row[3]);
                $ws->setCellValue("G{$r}", $row[4]);
                $ws->setCellValue("H{$r}", $row[5]);
            } else {
                $ws->setCellValue("A{$r}", $row[0]);
                $ws->mergeCells("B{$r}:I{$r}");
                $ws->setCellValue("B{$r}", $row[1]);
            }
            $r++;
        }

        $r++;
        $ws->setCellValue("A{$r}", 'INFORMASI KEGIATAN');
        $ws->mergeCells("A{$r}:I{$r}");
        $ws->getStyle("A{$r}")->getFont()->setBold(true);
        $r++;

        $headers = ['No', 'LOKASI', 'PEKERJA', 'JAM KERJA', 'TOTAL JAM KERJA', 'TOTAL KESELURUHAN', 'KETERANGAN'];
        $cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
        foreach ($headers as $i => $h) {
            $ws->setCellValue($cols[$i] . $r, $h);
        }
        $ws->getStyle("A{$r}:G{$r}")->getFont()->setBold(true);
        $r++;

        $no = 1;
        foreach ($data['informasi_kegiatan'] ?? [] as $item) {
            if (empty($item['lokasi']) && empty($item['pekerja'])) {
                continue;
            }
            $ws->setCellValue("A{$r}", $no++);
            $ws->setCellValue("B{$r}", $item['lokasi'] ?? '');
            $ws->setCellValue("C{$r}", $item['pekerja'] ?? '');
            $ws->setCellValue("D{$r}", $item['jam_kerja'] ?? '');
            $ws->setCellValue("E{$r}", $item['total_jam_kerja'] ?? '');
            $ws->setCellValue("F{$r}", $item['total_keseluruhan'] ?? '');
            $ws->setCellValue("G{$r}", $item['keterangan'] ?? '');
            $r++;
        }

        $ot = $data['overtime'] ?? [];
        $ws->setCellValue("A{$r}", '');
        $ws->setCellValue("B{$r}", 'OVERTIME');
        $ws->setCellValue("C{$r}", $ot['pekerja'] ?? '');
        $ws->setCellValue("D{$r}", $ot['jam_kerja'] ?? '');
        $ws->setCellValue("E{$r}", $ot['total_jam_kerja'] ?? '');
        $ws->setCellValue("F{$r}", $ot['total_keseluruhan'] ?? '');
        $ws->setCellValue("G{$r}", $ot['keterangan'] ?? '');
        $r++;

        $ws->setCellValue("B{$r}", 'TOTAL');
        $ws->setCellValue("F{$r}", $data['total_keseluruhan_jam'] ?? '');
        $r += 2;

        $ws->setCellValue("A{$r}", 'KINERJA HSE');
        $ws->mergeCells("A{$r}:E{$r}");
        $ws->setCellValue("F{$r}", 'CATATAN PERALATAN, KONDISI CUACA');
        $ws->mergeCells("F{$r}:I{$r}");
        $ws->getStyle("A{$r}:I{$r}")->getFont()->setBold(true);
        $r++;

        $kinerja = $data['kinerja_hse'] ?? [];
        $peralatan = $data['peralatan'] ?? [];
        $maxRows = max(count($kinerja), count($peralatan));

        for ($i = 0; $i < $maxRows; $i++) {
            $k = $kinerja[$i] ?? [];
            $p = $peralatan[$i] ?? [];
            $ws->setCellValue("A{$r}", $k['no'] ?? ($i + 1));
            $ws->setCellValue("B{$r}", $k['penjelasan'] ?? '');
            $ws->setCellValue("C{$r}", !empty($k['tidak']) ? '✓' : '');
            $ws->setCellValue("D{$r}", !empty($k['ya']) ? '✓' : '');
            $ws->setCellValue("E{$r}", $k['keterangan'] ?? '');
            $ws->setCellValue("F{$r}", $p['jenis'] ?? '');
            $ws->setCellValue("G{$r}", $p['jumlah'] ?? '');
            $ws->setCellValue("H{$r}", $p['waktu'] ?? '');
            $ws->setCellValue("I{$r}", $p['kondisi'] ?? '');
            $r++;
        }

        $r++;
        $ws->setCellValue("A{$r}", 'CATATAN DAN REKOMENDASI');
        $ws->mergeCells("A{$r}:I{$r}");
        $r++;
        $ws->mergeCells("A{$r}:I" . ($r + 3));
        $ws->setCellValue("A{$r}", $data['catatan_rekomendasi'] ?? '');
        $ws->getStyle("A{$r}")->getAlignment()->setWrapText(true);
        $r += 5;

        $ws->setCellValue("A{$r}", 'Prepare by: ' . ($data['prepare_by'] ?? ''));
        $ws->setCellValue("D{$r}", 'Checked by: ' . ($data['checked_by'] ?? ''));
        $ws->setCellValue("G{$r}", 'Approved by: ' . ($data['approved_by'] ?? ''));

        foreach (range('A', 'I') as $col) {
            $ws->getColumnDimension($col)->setAutoSize(true);
        }

        $ws->getStyle('A1:I' . $r)
            ->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        $writer = new Xlsx($sheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'hse_daily_') . '.xlsx';
        $writer->save($tempFile);

        return response()->download($tempFile, "{$baseName}.xlsx", [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * GET /daily-report/drafts
     */
    public function indexDrafts(Request $request)
    {
        $drafts = DailyReportDraft::query()
            ->where('user_id', $request->user()->id)
            ->orderByDesc('updated_at')
            ->get(['id', 'title', 'updated_at', 'created_at']);

        return response()->json(['success' => true, 'drafts' => $drafts]);
    }

    /**
     * GET /daily-report/drafts/{draft}
     */
    public function showDraft(Request $request, DailyReportDraft $draft)
    {
        if ($draft->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        return response()->json([
            'success' => true,
            'draft' => [
                'id' => $draft->id,
                'title' => $draft->title,
                'payload' => $draft->payload,
                'updated_at' => $draft->updated_at,
            ],
        ]);
    }

    /**
     * POST /daily-report/drafts
     */
    public function storeDraft(Request $request)
    {
        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'payload' => 'required|array',
        ]);

        $title = trim($validated['title'] ?? '') ?: $this->defaultDraftTitle($validated['payload']);

        $draft = DailyReportDraft::create([
            'user_id' => $request->user()->id,
            'title' => $title,
            'payload' => $validated['payload'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil disimpan.',
            'draft' => $draft->only(['id', 'title', 'updated_at']),
        ], 201);
    }

    /**
     * PUT /daily-report/drafts/{draft}
     */
    public function updateDraft(Request $request, DailyReportDraft $draft)
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
            'message' => 'Laporan berhasil diperbarui.',
            'draft' => $draft->only(['id', 'title', 'updated_at']),
        ]);
    }

    /**
     * DELETE /daily-report/drafts/{draft}
     */
    public function destroyDraft(Request $request, DailyReportDraft $draft)
    {
        if ($draft->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Akses ditolak.'], 403);
        }

        $draft->delete();

        return response()->json([
            'success' => true,
            'message' => 'Laporan berhasil dihapus.',
        ]);
    }

    protected function defaultDraftTitle(array $payload): string
    {
        $form = $payload['form'] ?? [];
        $parts = array_filter([
            trim($form['nama_pekerjaan'] ?? '') ?: null,
            trim($form['area_lokasi'] ?? '') ?: null,
            !empty($form['tanggal']) ? Carbon::parse($form['tanggal'])->format('d/m/Y') : null,
        ]);

        return implode(' · ', $parts) ?: 'HSE Daily Report ' . now()->format('d/m/Y H:i');
    }
}
