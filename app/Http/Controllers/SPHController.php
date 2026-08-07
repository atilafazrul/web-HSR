<?php

namespace App\Http\Controllers;

use App\Models\SphDocument;
use App\Services\BeritaAcaraPdfAssetService;
use App\Services\SignatureStampMerger;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ResolvesWhatsAppDivisi;
use App\Http\Controllers\Concerns\SavesDocumentToProjectFolder;

class SPHController extends Controller
{
    use ResolvesWhatsAppDivisi;
    use SavesDocumentToProjectFolder;

    private function bulanToRomawi(int $bulan): string
    {
        $romawi = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI',
            7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII',
        ];

        return $romawi[$bulan] ?? 'I';
    }

    private function generateNomorSurat(): array
    {
        $now = Carbon::now();
        $tahun = $now->year;
        $bulan = $now->month;
        $bulanRomawi = $this->bulanToRomawi($bulan);

        $lastDocument = SphDocument::where('tahun', $tahun)
            ->orderBy('nomor_urut', 'desc')
            ->first();

        $nomorUrut = $lastDocument ? $lastDocument->nomor_urut + 1 : 1;
        $nomorSurat = sprintf('%03d/PH-HSR/%s/%d', $nomorUrut, $bulanRomawi, $tahun);

        return [
            'nomor_surat' => $nomorSurat,
            'nomor_urut' => $nomorUrut,
            'bulan' => $bulan,
            'tahun' => $tahun,
            'bulan_romawi' => $bulanRomawi,
        ];
    }

    public function getNextNomorSurat()
    {
        $nomorData = $this->generateNomorSurat();

        return response()->json($nomorData);
    }

    public function getHistory()
    {
        $documents = SphDocument::orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $documents,
        ]);
    }

    public function generatePDF(Request $request)
    {
        $validated = $this->validatePayload($request);

        $nomorData = $this->generateNomorSurat();
        $items = $this->normalizeItems($validated['items']);
        $totalHarga = $this->calculateTotal($items);

        $document = SphDocument::create([
            'nomor_surat' => $nomorData['nomor_surat'],
            'lampiran' => $validated['lampiran'] ?? '-',
            'perihal' => $validated['perihal'] ?? 'Penawaran Harga',
            'penerima_nama' => $validated['penerima_nama'],
            'paragraf_pembuka' => $this->sanitizeHtml($validated['paragraf_pembuka'] ?? null),
            'items' => $items,
            'total_harga' => $totalHarga,
            'kota_tanda_tangan' => trim((string) ($validated['kota_tanda_tangan'] ?? '')) ?: 'Tangerang',
            'tanggal_tanda_tangan' => $validated['tanggal_tanda_tangan'],
            'nama_penandatangan' => trim((string) ($validated['nama_penandatangan'] ?? '')) ?: null,
            'jabatan_penandatangan' => trim((string) ($validated['jabatan_penandatangan'] ?? '')) ?: 'Direktur',
            'syarat_ketentuan' => $this->sanitizeHtml($validated['syarat_ketentuan'] ?? null),
            'paragraf_penutup' => $this->sanitizeHtml($validated['paragraf_penutup'] ?? null),
            'nomor_urut' => $nomorData['nomor_urut'],
            'bulan' => $nomorData['bulan'],
            'tahun' => $nomorData['tahun'],
        ]);

        app(WhatsAppService::class)->notifyDocumentCreated(
            'SPH',
            $validated['penerima_nama'],
            $nomorData['nomor_surat'],
            $this->whatsAppDivisiFromRequest($request)
        );

        return $this->generatePDFResponse($this->documentToPdfData($document), $validated['projek_kerja_id'] ?? null);
    }

    public function show($id)
    {
        $document = SphDocument::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $document,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $this->validatePayload($request);
        $document = SphDocument::findOrFail($id);
        $document->update($this->buildDocumentAttributes($validated));

        return response()->json([
            'success' => true,
            'message' => 'Dokumen SPH berhasil diperbarui',
            'data' => $document->fresh(),
        ]);
    }

    public function regeneratePDF($id)
    {
        $document = SphDocument::findOrFail($id);

        return $this->generatePDFResponse($this->documentToPdfData($document));
    }

    public function destroy($id)
    {
        try {
            SphDocument::findOrFail($id)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Dokumen berhasil dihapus',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus dokumen',
            ], 500);
        }
    }

    public function validatePayload(Request $request): array
    {
        return $request->validate([
            'lampiran' => 'nullable|string|max:100',
            'perihal' => 'nullable|string|max:200',
            'penerima_nama' => 'required|string|max:255',
            'paragraf_pembuka' => 'nullable|string|max:50000',
            'items' => 'required|array|min:1',
            'items.*.nama_item' => 'required|string',
            'items.*.deskripsi' => 'nullable|string',
            'items.*.qty' => 'required|string',
            'items.*.harga' => 'required|numeric|min:0',
            'kota_tanda_tangan' => 'nullable|string|max:100',
            'tanggal_tanda_tangan' => 'required|string',
            'nama_penandatangan' => 'nullable|string|max:150',
            'jabatan_penandatangan' => 'nullable|string|max:150',
            'syarat_ketentuan' => 'nullable|string|max:50000',
            'paragraf_penutup' => 'nullable|string|max:50000',
            'projek_kerja_id' => 'nullable|integer|exists:projek_kerjas,id',
        ]);
    }

    public function buildDocumentAttributes(array $validated): array
    {
        $items = $this->normalizeItems($validated['items']);

        return [
            'lampiran' => $validated['lampiran'] ?? '-',
            'perihal' => $validated['perihal'] ?? 'Penawaran Harga',
            'penerima_nama' => $validated['penerima_nama'],
            'paragraf_pembuka' => $this->sanitizeHtml($validated['paragraf_pembuka'] ?? null),
            'items' => $items,
            'total_harga' => $this->calculateTotal($items),
            'kota_tanda_tangan' => trim((string) ($validated['kota_tanda_tangan'] ?? '')) ?: 'Tangerang',
            'tanggal_tanda_tangan' => $validated['tanggal_tanda_tangan'],
            'nama_penandatangan' => trim((string) ($validated['nama_penandatangan'] ?? '')) ?: null,
            'jabatan_penandatangan' => trim((string) ($validated['jabatan_penandatangan'] ?? '')) ?: 'Direktur',
            'syarat_ketentuan' => $this->sanitizeHtml($validated['syarat_ketentuan'] ?? null),
            'paragraf_penutup' => $this->sanitizeHtml($validated['paragraf_penutup'] ?? null),
        ];
    }

    private function documentToPdfData(SphDocument $document): array
    {
        $items = collect($document->items ?? [])->map(function ($item) {
            $harga = (int) ($item['harga'] ?? 0);
            $qty = max(1, (int) preg_replace('/\D+/', '', (string) ($item['qty'] ?? '1')) ?: 1);
            $total = (int) ($item['total_harga'] ?? ($harga * $qty));

            return array_merge($item, [
                'harga_formatted' => $this->formatRupiah($harga),
                'total_harga_formatted' => $this->formatRupiah($total),
                'deskripsi_html' => $this->deskripsiToHtml($item['deskripsi'] ?? ''),
            ]);
        })->all();

        $showDeskripsiColumn = collect($items)->contains(
            fn (array $item) => trim((string) ($item['deskripsi_html'] ?? '')) !== ''
        );

        return [
            'nomor_surat' => $document->nomor_surat,
            'lampiran' => $document->lampiran ?: '-',
            'perihal' => $document->perihal ?: 'Penawaran Harga',
            'penerima_nama' => $document->penerima_nama,
            'paragraf_pembuka' => $this->prepareRichContentForPdf($document->paragraf_pembuka),
            'items' => $items,
            'show_deskripsi_column' => $showDeskripsiColumn,
            'total_harga' => $document->total_harga,
            'total_harga_formatted' => $this->formatRupiah((int) $document->total_harga),
            'kota_tanda_tangan' => $document->kota_tanda_tangan ?: 'Tangerang',
            'tanggal_tanda_tangan' => $document->tanggal_tanda_tangan,
            'nama_penandatangan' => $document->nama_penandatangan,
            'jabatan_penandatangan' => $document->jabatan_penandatangan ?: 'Direktur',
            'syarat_ketentuan' => $this->prepareRichContentForPdf(
                $this->richTextOrNull($document->syarat_ketentuan)
            ),
            'paragraf_penutup' => $this->prepareRichContentForPdf(
                $this->richTextOrNull($document->paragraf_penutup)
            ),
        ];
    }

    private function generatePDFResponse(array $data, ?int $projekKerjaId = null)
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);
        $data = app(BeritaAcaraPdfAssetService::class)->enrich($data);
        $data = $this->applySignatureAndCap($data);

        $html = view('pdf.sph', $data)->render();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'SPH-' . str_replace('/', '-', $data['nomor_surat']) . '.pdf';
        $pdfOutput = $dompdf->output();

        $this->saveDocumentPdfToProjectFolder($projekKerjaId, $pdfOutput, $filename);

        return response()->make($pdfOutput, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    private function applySignatureAndCap(array $data): array
    {
        $signaturePath = public_path('images/TTD Direktur.png');
        $capStampPath = public_path('images/Cap HSR.png');

        $signatureDataUrl = null;
        if (file_exists($signaturePath)) {
            $signatureDataUrl = 'data:image/png;base64,' . base64_encode(file_get_contents($signaturePath));
        }

        if (file_exists($capStampPath)) {
            $capStampBase64 = 'data:image/png;base64,' . base64_encode(file_get_contents($capStampPath));
            $merger = new SignatureStampMerger();
            $data['ttd_penandatangan'] = $merger->merge($signatureDataUrl, $capStampBase64);
            $data['ttd_penandatangan_merged'] = true;
        } elseif (!empty($signatureDataUrl)) {
            $data['ttd_penandatangan'] = $signatureDataUrl;
            $data['ttd_penandatangan_merged'] = false;
        }

        return $data;
    }

    private function normalizeItems(array $items): array
    {
        return collect($items)->values()->map(function ($item, $index) {
            $harga = (int) ($item['harga'] ?? 0);
            $qty = max(1, (int) preg_replace('/\D+/', '', (string) ($item['qty'] ?? '1')) ?: 1);

            return [
                'no' => $index + 1,
                'nama_item' => trim((string) ($item['nama_item'] ?? '')),
                'deskripsi' => trim((string) ($item['deskripsi'] ?? '')),
                'qty' => (string) ($item['qty'] ?? '1'),
                'harga' => $harga,
                'total_harga' => $harga * $qty,
            ];
        })->all();
    }

    private function calculateTotal(array $items): int
    {
        return (int) collect($items)->sum('total_harga');
    }

    private function sanitizeHtml(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        return strip_tags($html, '<p><br><strong><b><em><i><u><ol><ul><li><span>');
    }

    private function deskripsiToHtml(string $deskripsi): string
    {
        $deskripsi = trim($deskripsi);
        if ($deskripsi === '') {
            return '';
        }

        if (str_contains($deskripsi, '<')) {
            $sanitized = $this->sanitizeHtml($deskripsi) ?? '';

            return $this->richHtmlToPdfCell($sanitized);
        }

        $lines = preg_split('/\r\n|\r|\n/', $deskripsi) ?: [];
        $items = array_values(array_filter(array_map('trim', $lines), fn ($line) => $line !== ''));

        if ($items === []) {
            return '';
        }

        if (count($items) === 1) {
            return e($items[0]);
        }

        return collect($items)
            ->map(fn ($line) => '• ' . e(ltrim($line, "•-\t ")))
            ->implode('<br>');
    }

    /**
     * Dompdf tidak konsisten merender <ul>/<ol> di dalam sel tabel.
     * Konversi ke bullet + <br> agar deskripsi tetap tampil di PDF.
     */
    private function richHtmlToPdfCell(string $html): string
    {
        $html = trim($html);
        if ($html === '') {
            return '';
        }

        if (preg_match('/<li[\s>]/i', $html)) {
            preg_match_all('/<li[^>]*>(.*?)<\/li>/is', $html, $matches);
            $isOrdered = (bool) preg_match('/<ol[\s>]/i', $html);
            $lines = [];

            foreach ($matches[1] ?? [] as $index => $chunk) {
                $text = $this->plainTextFromHtmlFragment($chunk);
                if ($text === '') {
                    continue;
                }
                $prefix = $isOrdered ? ((int) $index + 1) . '. ' : '• ';
                $lines[] = $prefix . e($text);
            }

            if ($lines !== []) {
                return implode('<br>', $lines);
            }
        }

        if (preg_match('/<p[\s>]/i', $html)) {
            preg_match_all('/<p[^>]*>(.*?)<\/p>/is', $html, $matches);
            $lines = [];

            foreach ($matches[1] ?? [] as $chunk) {
                $text = $this->plainTextFromHtmlFragment($chunk);
                if ($text !== '') {
                    $lines[] = e($text);
                }
            }

            if ($lines !== []) {
                return implode('<br>', $lines);
            }
        }

        $plain = $this->plainTextFromHtmlFragment($html);

        return $plain !== '' ? e($plain) : '';
    }

    private function plainTextFromHtmlFragment(string $html): string
    {
        $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\xc2\xa0/u', ' ', $text) ?? $text;

        return trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
    }

    /** Null jika rich text kosong (editor dikosongkan / hanya tag HTML). */
    private function richTextOrNull(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        $sanitized = $this->sanitizeHtml($html);
        if ($sanitized === null) {
            return null;
        }

        if (preg_match('/<li[\s>]/i', $sanitized)) {
            preg_match_all('/<li[^>]*>(.*?)<\/li>/is', $sanitized, $matches);
            foreach ($matches[1] ?? [] as $chunk) {
                if ($this->plainTextFromHtmlFragment($chunk) !== '') {
                    return $sanitized;
                }
            }

            return null;
        }

        return $this->plainTextFromHtmlFragment($sanitized) !== '' ? $sanitized : null;
    }

    /**
     * Dompdf mengabaikan spasi/em-space di awal paragraf.
     * Konversi indent Tab (spasi/nbsp) menjadi text-indent agar tampil di PDF.
     */
    private function prepareRichContentForPdf(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        $result = preg_replace_callback(
            '/<p(\s[^>]*)?>(.*?)<\/p>/is',
            function (array $matches): string {
                $attrs = $matches[1] ?? '';
                $inner = $matches[2];
                [$units, $rest] = $this->splitLeadingIndent($inner);

                if ($units <= 0) {
                    return $matches[0];
                }

                $style = 'text-indent:' . round($units * 1.5, 2) . 'em;';
                if (preg_match('/style="([^"]*)"/i', $attrs, $styleMatch)) {
                    $attrs = preg_replace(
                        '/style="[^"]*"/i',
                        'style="' . $styleMatch[1] . $style . '"',
                        $attrs
                    );
                } else {
                    $attrs .= ' style="' . $style . '"';
                }

                return '<p' . $attrs . '>' . $rest . '</p>';
            },
            $html
        );

        return $result ?? $html;
    }

    /** @return array{0: int, 1: string} */
    private function splitLeadingIndent(string $inner): array
    {
        $rest = $inner;
        $charCount = 0;

        while ($rest !== '') {
            if (preg_match('/^(\s+)/u', $rest, $match)) {
                $charCount += mb_strlen($match[1]);
                $rest = mb_substr($rest, mb_strlen($match[1]));
                continue;
            }

            if (preg_match('/^(&nbsp;|&#160;|&#8195;)/iu', $rest, $match)) {
                $charCount++;
                $rest = substr($rest, strlen($match[0]));
                continue;
            }

            if (preg_match('/^(\x{2003})/u', $rest, $match)) {
                $charCount++;
                $rest = mb_substr($rest, 1);
                continue;
            }

            break;
        }

        if ($charCount === 0) {
            return [0, $inner];
        }

        // 4 spasi/nbsp = 1x Tab (seperti di editor Word)
        return [max(1, (int) ceil($charCount / 4)), $rest];
    }

    public function formatRupiah(int $amount): string
    {
        return 'Rp. ' . number_format($amount, 0, ',', '.') . ',-';
    }
}
