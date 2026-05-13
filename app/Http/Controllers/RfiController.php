<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class RfiController extends Controller
{
    /**
     * Path absolute template RFI yang sudah disediakan.
     */
    protected function templatePath(): string
    {
        return storage_path('app/private/templates/format_rfi.xlsx');
    }

    /**
     * Format tanggal Indonesia: "15 Mei 2026"
     */
    protected function formatTanggalId($dateString): string
    {
        if (empty($dateString)) {
            return '';
        }

        try {
            return Carbon::parse($dateString)->locale('id')->translatedFormat('d F Y');
        } catch (\Throwable $e) {
            return (string) $dateString;
        }
    }

    /**
     * Generate RFI: load template -> isi field -> kirim sebagai download xlsx.
     *
     * Body request:
     *   kepada           string
     *   tanggal          date (Y-m-d) optional
     *   oleh             string (default user.name)
     *   perusahaan       string (default "PT. Hayati Semesta Raharja (HSR)")
     *   perihal          string
     *   lampiran         string
     *   pihak_terlibat   array<string> (max 7)
     *   permintaan       array<string> (max 4)
     *   note             string
     *   nama_perusahaan_kiri    string (default "PT. Hayati Semesta Raharja (HSR)")
     *   nama_perusahaan_tengah  string (default "PT. Indosopha Sakti")
     *   pemberi_tugas    string
     *   dokumentasi      array<{ nama_ruangan: string, foto?: UploadedFile }>
     */
    public function generate(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'kepada'                 => 'nullable|string|max:255',
            'tanggal'                => 'nullable|date',
            'oleh'                   => 'nullable|string|max:255',
            'perusahaan'             => 'nullable|string|max:255',
            'perihal'                => 'nullable|string|max:500',
            'lampiran'               => 'nullable|string|max:500',
            'pihak_terlibat'         => 'nullable|array|max:7',
            'pihak_terlibat.*'       => 'nullable|string|max:255',
            'permintaan'             => 'nullable|array|max:4',
            'permintaan.*'           => 'nullable|string|max:500',
            'note'                   => 'nullable|string|max:5000',
            'nama_perusahaan_kiri'   => 'nullable|string|max:255',
            'nama_perusahaan_tengah' => 'nullable|string|max:255',
            'pemberi_tugas'          => 'nullable|string|max:255',
            'dokumentasi'                => 'nullable|array|max:20',
            'dokumentasi.*.nama_ruangan' => 'nullable|string|max:255',
            'dokumentasi.*.foto'         => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
        ]);

        if (!file_exists($this->templatePath())) {
            return response()->json([
                'success' => false,
                'message' => 'Template RFI tidak ditemukan di server.',
            ], 500);
        }

        $spreadsheet = IOFactory::load($this->templatePath());

        /* ============================================
         * SHEET 1 — FORM RFI HEADER
         * ============================================ */
        $sheet = $spreadsheet->getSheet(0);

        // Default-default supaya field kosong tetap diisi nilai default
        $oleh       = $validated['oleh']
            ?? ($user->name ?? 'Nanda Afriansyah');
        $perusahaan = $validated['perusahaan']
            ?? 'PT. Hayati Semesta Raharja (HSR)';
        $tanggal    = $this->formatTanggalId($validated['tanggal'] ?? now()->toDateString());

        // === HEADER FIELD (E/J kolom = nilai, D/I kolom adalah ":") ===
        $sheet->setCellValue('E5', $validated['kepada']   ?? '');
        $sheet->setCellValue('J5', $oleh);
        $sheet->setCellValue('E6', $tanggal);
        $sheet->setCellValue('J6', $perusahaan);
        $sheet->setCellValue('E7', $validated['perihal']  ?? '');
        $sheet->setCellValue('J7', $validated['lampiran'] ?? '');

        // Selaraskan dengan template: Perihal (C7:C8) pakai valign center; nilai di E7:G8 masih valign top sehingga tampak "naik".
        $sheet->getStyle('E7:G8')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $sheet->getStyle('J7:L8')->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        // Nama penerima: sedikit indent agar tidak mepet tepi kolom (selaras dengan ":").
        $sheet->getStyle('E5:G5')->getAlignment()->setIndent(2);

        // === PIHAK YANG TERLIBAT (C10..C16) ===
        // Cell sudah berisi "1.", "2.", ... — kita override dengan "1. Nama"
        $pihakRows = ['C10', 'C11', 'C12', 'C13', 'C14', 'C15', 'C16'];
        foreach ($pihakRows as $idx => $coord) {
            $isi = $validated['pihak_terlibat'][$idx] ?? '';
            $num = ($idx + 1) . '.';
            $sheet->setCellValue($coord, trim($isi) === '' ? $num : ($num . ' ' . $isi));
        }

        // === DAFTAR PERMINTAAN APPROVAL (C18..C21) ===
        $permintaanRows = ['C18', 'C19', 'C20', 'C21'];
        foreach ($permintaanRows as $idx => $coord) {
            $isi = $validated['permintaan'][$idx] ?? '';
            $num = ($idx + 1) . '.';
            $sheet->setCellValue($coord, trim($isi) === '' ? $num : ($num . ' ' . $isi));
        }

        // === NOTE (C23:L27, merged) ===
        $note = $validated['note'] ?? '';
        if ($note !== '') {
            $sheet->setCellValue('C23', "Note : \n" . $note);
            $sheet->getStyle('C23')->getAlignment()->setWrapText(true);
            $sheet->getStyle('C23')->getAlignment()->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_TOP);
        }

        // === FOOTER PERUSAHAAN ===
        if (!empty($validated['nama_perusahaan_kiri'])) {
            $sheet->setCellValue('C51', $validated['nama_perusahaan_kiri']);
        }
        if (!empty($validated['nama_perusahaan_tengah'])) {
            $sheet->setCellValue('G51', $validated['nama_perusahaan_tengah']);
        }
        if (!empty($validated['pemberi_tugas'])) {
            $sheet->setCellValue('J51', $validated['pemberi_tugas']);
        }

        // === NAMA PENANDA TANGAN (di atas baris tanda tangan) ===
        // Judul "Dibuat oleh," di merge C44:E44; tanpa merge, nama di C45 tampak mepet kiri.
        foreach (['C45:E45', 'G45:H45', 'J45:L45'] as $range) {
            $sheet->mergeCells($range);
            $sheet->getStyle($range)->getAlignment()
                ->setHorizontal(Alignment::HORIZONTAL_CENTER)
                ->setVertical(Alignment::VERTICAL_BOTTOM);
        }
        $sheet->setCellValue('C45', $oleh);

        /* ============================================
         * SHEET 2 — DOKUMENTASI (Nama Ruangan + Foto)
         * ============================================ */
        $sheet2 = $spreadsheet->getSheetCount() > 1 ? $spreadsheet->getSheet(1) : null;
        if ($sheet2 && !empty($validated['dokumentasi'])) {
            $startRow = 5; // baris pertama data
            // Setiap "baris" sebenarnya rentang 2 baris (mis. A5:A6 nomor digabung)
            // Tapi karena template aslinya tidak merged, kita pakai single row per entry.

            // Bersihkan baris awal (A5..A11 sudah ada placeholder no)
            for ($r = 5; $r <= 60; $r++) {
                $sheet2->setCellValue('A' . $r, '');
                $sheet2->setCellValue('B' . $r, '');
            }

            $row = $startRow;
            foreach ($validated['dokumentasi'] as $idx => $item) {
                $sheet2->setCellValue('A' . $row, $idx + 1);
                $sheet2->setCellValue('B' . $row, $item['nama_ruangan'] ?? '');

                // Insert foto kalau ada
                if ($request->hasFile("dokumentasi.$idx.foto")) {
                    $file = $request->file("dokumentasi.$idx.foto");
                    $tmpPath = $file->getRealPath();

                    $drawing = new Drawing();
                    $drawing->setName('Dokumentasi ' . ($idx + 1));
                    $drawing->setDescription('Foto dokumentasi');
                    $drawing->setPath($tmpPath, true);
                    $drawing->setCoordinates('C' . $row);
                    $drawing->setHeight(120);
                    $drawing->setOffsetX(5);
                    $drawing->setOffsetY(5);
                    $drawing->setWorksheet($sheet2);

                    $sheet2->getRowDimension($row)->setRowHeight(95);
                }

                // Set lebar minimum baris untuk teks
                if (!$request->hasFile("dokumentasi.$idx.foto")) {
                    $sheet2->getRowDimension($row)->setRowHeight(40);
                }

                $sheet2->getStyle('A' . $row . ':C' . $row)
                    ->getAlignment()
                    ->setVertical(\PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER);

                $sheet2->getStyle('A' . $row . ':C' . $row)
                    ->getBorders()->getAllBorders()->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

                $row++;
            }

            // Atur lebar kolom
            $sheet2->getColumnDimension('A')->setWidth(8);
            $sheet2->getColumnDimension('B')->setWidth(35);
            $sheet2->getColumnDimension('C')->setWidth(40);
        }

        /* ============================================
         * OUTPUT — kirim sebagai download
         * ============================================ */
        $filename = 'RFI_' . Carbon::now()->format('Ymd_His') . '.xlsx';

        $writer = new Xlsx($spreadsheet);

        $tempFile = tempnam(sys_get_temp_dir(), 'rfi_') . '.xlsx';
        $writer->save($tempFile);

        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }
}
