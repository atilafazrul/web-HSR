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
        $attributes = $this->buildDocumentAttributes($validated);

        $document = SphDocument::create(array_merge($attributes, [
            'projek_kerja_id' => $validated['projek_kerja_id'] ?? null,
            'nomor_surat' => $nomorData['nomor_surat'],
            'nomor_urut' => $nomorData['nomor_urut'],
            'bulan' => $nomorData['bulan'],
            'tahun' => $nomorData['tahun'],
        ]));

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

    public function destroy(Request $request, $id)
    {
        $actor = $request->user();
        $role = strtolower(str_replace([' ', '-'], '_', trim((string) ($actor->role ?? ''))));
        if (!in_array($role, ['super_admin', 'admin'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya admin atau superadmin yang dapat menghapus dokumen ini'
            ], 403);
        }

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
            'divisi' => 'nullable|string|max:50',
            'lampiran' => 'nullable|string|max:100',
            'perihal' => 'nullable|string|max:200',
            'penerima_nama' => 'required|string|max:255',
            'paragraf_pembuka' => 'nullable|string|max:50000',
            'items' => 'required|array|min:1',
            'items.*.nama_item' => 'required|string',
            'items.*.deskripsi' => 'nullable|string|max:4000000',
            'items.*.qty' => 'required|string',
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.harga' => 'required|numeric|min:0',
            'pakai_diskon' => 'nullable|boolean',
            'diskon_persen' => 'nullable|numeric|min:0|max:100',
            'diskon_nominal' => 'nullable|numeric|min:0',
            'show_total' => 'nullable|boolean',
            'pakai_ppn' => 'nullable|boolean',
            'ppn_persen' => 'nullable|numeric|min:0|max:100',
            'kota_tanda_tangan' => 'nullable|string|max:100',
            'tanggal_tanda_tangan' => 'required|string',
            'nama_penandatangan' => 'nullable|string|max:150',
            'jabatan_penandatangan' => 'nullable|string|max:150',
            'syarat_ketentuan' => 'nullable|string|max:50000',
            'paragraf_penutup' => 'nullable|string|max:50000',
            'pakai_rekapitulasi' => 'nullable|boolean',
            'rekapitulasi_judul' => 'nullable|string|max:255',
            'rekapitulasi_data' => 'nullable|array',
            'projek_kerja_id' => 'nullable|integer|exists:projek_kerjas,id',
        ]);
    }

    public function buildDocumentAttributes(array $validated): array
    {
        $divisi = strtolower(trim((string) ($validated['divisi'] ?? '')));
        $isKontraktor = $divisi === 'kontraktor';
        $pakaiRekap = $isKontraktor && (array_key_exists('pakai_rekapitulasi', $validated) ? (bool) $validated['pakai_rekapitulasi'] : false);
        $rekapData = $pakaiRekap ? $this->normalizeRekapitulasiData($validated['rekapitulasi_data'] ?? []) : [];

        // Jika mode Rekapitulasi (khususnya Kontraktor) aktif, baris item di Halaman 1
        // adalah turunan otomatis dari setiap Kategori Pekerjaan di Halaman 2 (Rekapitulasi)
        if ($pakaiRekap && !empty($rekapData)) {
            $syncedItems = [];
            $rekapSubtotal = 0;
            foreach ($rekapData as $index => $cat) {
                $catSubtotal = (int) ($cat['subtotal'] ?? 0);
                $rekapSubtotal += $catSubtotal;
                $syncedItems[] = [
                    'no' => $index + 1,
                    'nama_item' => $cat['judul_kategori'] ?: ('Pekerjaan ' . ($cat['nomor_romawi'] ?? ($index + 1))),
                    'deskripsi' => '',
                    'qty' => (string) ($cat['qty'] ?? '1'),
                    'unit' => (string) ($cat['unit'] ?? 'Ls'),
                    'harga' => $catSubtotal,
                    'total_harga' => $catSubtotal,
                ];
            }
            $items = $syncedItems;
            $subtotal = $rekapSubtotal;
        } else {
            $items = $this->normalizeItems($validated['items']);
            $subtotal = $this->calculateTotal($items);
        }

        $pakaiDiskon = array_key_exists('pakai_diskon', $validated) ? (bool) $validated['pakai_diskon'] : false;
        $diskonPersen = $pakaiDiskon ? (float) ($validated['diskon_persen'] ?? 0) : 0;
        $diskonNominal = $pakaiDiskon ? (int) round($subtotal * ($diskonPersen / 100)) : 0;
        $dpp = max(0, $subtotal - $diskonNominal);
        $pakaiPpn = array_key_exists('pakai_ppn', $validated) ? (bool) $validated['pakai_ppn'] : false;
        $ppnPersen = $pakaiPpn ? (float) ($validated['ppn_persen'] ?? 11) : 0;
        $ppnNominal = $pakaiPpn ? (int) round($dpp * ($ppnPersen / 100)) : 0;
        $totalHarga = $dpp + $ppnNominal;

        return [
            'divisi' => trim((string) ($validated['divisi'] ?? '')) ?: null,
            'lampiran' => $validated['lampiran'] ?? '-',
            'perihal' => $validated['perihal'] ?? 'Penawaran Harga',
            'penerima_nama' => $validated['penerima_nama'],
            'paragraf_pembuka' => $this->sanitizeHtml($validated['paragraf_pembuka'] ?? null),
            'items' => $items,
            'subtotal' => $subtotal,
            'pakai_diskon' => $pakaiDiskon,
            'diskon_persen' => $diskonPersen,
            'diskon_nominal' => $diskonNominal,
            'pakai_ppn' => $pakaiPpn,
            'ppn_persen' => $ppnPersen,
            'ppn_nominal' => $ppnNominal,
            'total_harga' => $totalHarga,
            'show_total' => array_key_exists('show_total', $validated) ? (bool) $validated['show_total'] : true,
            'kota_tanda_tangan' => trim((string) ($validated['kota_tanda_tangan'] ?? '')) ?: 'Tangerang',
            'tanggal_tanda_tangan' => $validated['tanggal_tanda_tangan'],
            'nama_penandatangan' => trim((string) ($validated['nama_penandatangan'] ?? '')) ?: null,
            'jabatan_penandatangan' => trim((string) ($validated['jabatan_penandatangan'] ?? '')) ?: 'Direktur',
            'syarat_ketentuan' => $this->sanitizeHtml($validated['syarat_ketentuan'] ?? null),
            'paragraf_penutup' => $this->sanitizeHtml($validated['paragraf_penutup'] ?? null),
            'pakai_rekapitulasi' => $pakaiRekap,
            'rekapitulasi_judul' => $pakaiRekap ? (trim((string) ($validated['rekapitulasi_judul'] ?? '')) ?: null) : null,
            'rekapitulasi_data' => $rekapData,
        ];
    }

    private function documentToPdfData(SphDocument $document): array
    {
        $items = collect($document->items ?? [])->map(function ($item) {
            $harga = (int) ($item['harga'] ?? 0);
            $qty = max(1, (int) preg_replace('/\D+/', '', (string) ($item['qty'] ?? '1')) ?: 1);
            $total = (int) ($item['total_harga'] ?? ($harga * $qty));

            return array_merge($item, [
                'unit' => $item['unit'] ?? 'Ls',
                'harga_formatted' => $this->formatRupiah($harga),
                'total_harga_formatted' => $this->formatRupiah($total),
                'deskripsi_html' => $this->deskripsiToHtml($item['deskripsi'] ?? ''),
            ]);
        })->all();

        $showDeskripsiColumn = collect($items)->contains(
            fn (array $item) => trim(strip_tags((string) ($item['deskripsi_html'] ?? ''), '<img>')) !== ''
                || str_contains((string) ($item['deskripsi_html'] ?? ''), '<img')
        );

        $subtotal = (int) ($document->subtotal ?? $document->total_harga);
        $pakaiDiskon = (bool) ($document->pakai_diskon ?? ((int) ($document->diskon_nominal ?? 0) > 0));
        $diskonPersen = (float) ($document->diskon_persen ?? 0);
        $diskonNominal = (int) ($document->diskon_nominal ?? 0);
        $diskonPersenLabel = rtrim(rtrim(number_format($diskonPersen, 2, ',', '.'), '0'), ',');
        $pakaiPpn = (bool) ($document->pakai_ppn ?? false);
        $ppnPersen = (float) ($document->ppn_persen ?? 11);
        $ppnNominal = (int) ($document->ppn_nominal ?? 0);
        $ppnPersenLabel = rtrim(rtrim(number_format($ppnPersen, 2, ',', '.'), '0'), ',');

        return [
            'divisi' => $document->divisi,
            'nomor_surat' => $document->nomor_surat,
            'lampiran' => $document->lampiran ?: '-',
            'perihal' => $document->perihal ?: 'Penawaran Harga',
            'penerima_nama' => $document->penerima_nama,
            'paragraf_pembuka' => $this->prepareRichContentForPdf($document->paragraf_pembuka),
            'items' => $items,
            'show_deskripsi_column' => $showDeskripsiColumn,
            'show_total' => (bool) ($document->show_total ?? true),
            'subtotal' => $subtotal,
            'subtotal_formatted' => $this->formatRupiah($subtotal),
            'pakai_diskon' => $pakaiDiskon,
            'diskon_persen' => $diskonPersen,
            'diskon_persen_label' => $diskonPersenLabel,
            'diskon_nominal' => $diskonNominal,
            'diskon_formatted' => $this->formatRupiah($diskonNominal),
            'pakai_ppn' => $pakaiPpn,
            'ppn_persen' => $ppnPersen,
            'ppn_persen_label' => $ppnPersenLabel,
            'ppn_nominal' => $ppnNominal,
            'ppn_formatted' => $this->formatRupiah($ppnNominal),
            'total_harga' => (int) $document->total_harga,
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
            'pakai_rekapitulasi' => (strtolower(trim((string) ($document->divisi ?? ''))) === 'kontraktor') && (bool) ($document->pakai_rekapitulasi ?? false),
            'rekapitulasi_judul' => $document->rekapitulasi_judul ?: ($document->perihal ?: 'REKAPITULASI BIAYA PEKERJAAN'),
            'rekapitulasi' => ((strtolower(trim((string) ($document->divisi ?? ''))) === 'kontraktor') && (bool) ($document->pakai_rekapitulasi ?? false))
                ? $this->prepareRekapitulasiForPdf(
                    $document->rekapitulasi_data ?? [],
                    $pakaiPpn,
                    $ppnPersen
                )
                : ['groups' => [], 'total' => 0, 'vat' => 0, 'grand_total' => 0],
        ];
    }

    private function generatePDFResponse(array $data, ?int $projekKerjaId = null)
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);

        $dompdf = new Dompdf($options);
        $data = app(BeritaAcaraPdfAssetService::class)->enrich($data);
        $data = $this->applySignatureAndCap($data);

        $html = view('pdf.sph', $data)->render();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'SPH-' . str_replace('/', '-', $data['nomor_surat']) . '.pdf';
        $pdfOutput = $dompdf->output();

        $this->saveDocumentPdfToProjectFolder($projekKerjaId, $pdfOutput, $filename, 'SPH');

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
                'deskripsi' => $this->sanitizeHtml(trim((string) ($item['deskripsi'] ?? ''))) ?? '',
                'qty' => (string) ($item['qty'] ?? '1'),
                'unit' => trim((string) ($item['unit'] ?? 'Ls')) ?: 'Ls',
                'harga' => $harga,
                'total_harga' => $harga * $qty,
            ];
        })->all();
    }

    private function calculateTotal(array $items): int
    {
        return (int) collect($items)->sum('total_harga');
    }

    private function intToRoman(int $number): string
    {
        $map = [
            1000 => 'M', 900 => 'CM', 500 => 'D', 400 => 'CD',
            100 => 'C', 90 => 'XC', 50 => 'L', 40 => 'XL',
            10 => 'X', 9 => 'IX', 5 => 'V', 4 => 'IV', 1 => 'I'
        ];
        $result = '';
        foreach ($map as $val => $roman) {
            while ($number >= $val) {
                $result .= $roman;
                $number -= $val;
            }
        }
        return $result ?: 'I';
    }

    private function normalizeRekapitulasiData(mixed $data): array
    {
        if (!is_array($data)) {
            return [];
        }

        $normalized = [];
        $catIndex = 1;

        foreach ($data as $cat) {
            if (!is_array($cat)) {
                continue;
            }

            $judul = trim((string) ($cat['judul_kategori'] ?? ''));
            $rawItems = is_array($cat['items'] ?? null) ? $cat['items'] : [];

            $normalizedItems = [];
            $itemSubtotal = 0;
            $itemIndex = 1;

            foreach ($rawItems as $item) {
                if (!is_array($item)) {
                    continue;
                }
                $deskripsi = trim((string) ($item['deskripsi'] ?? ''));
                if ($deskripsi === '') {
                    continue;
                }

                $satuan = trim((string) ($item['satuan'] ?? ''));
                $vol = (float) ($item['vol'] ?? $item['volume'] ?? 1);
                if ($vol <= 0) {
                    $vol = 1;
                }
                $material = (float) ($item['material'] ?? $item['harga_material'] ?? 0);
                $jasa = (float) ($item['jasa'] ?? $item['harga_jasa'] ?? 0);
                $totalItem = (int) round($vol * ($material + $jasa));
                $itemSubtotal += $totalItem;

                $normalizedItems[] = [
                    'nomor' => (int) ($item['nomor'] ?? $itemIndex),
                    'deskripsi' => $deskripsi,
                    'satuan' => $satuan,
                    'vol' => $vol,
                    'material' => (int) round($material),
                    'jasa' => (int) round($jasa),
                    'total_harga' => $totalItem,
                ];
                $itemIndex++;
            }

            if ($judul !== '' || !empty($normalizedItems)) {
                $romawi = trim((string) ($cat['nomor_romawi'] ?? '')) ?: $this->intToRoman($catIndex);
                $normalized[] = [
                    'nomor_romawi' => $romawi,
                    'judul_kategori' => $judul,
                    'qty' => trim((string) ($cat['qty'] ?? '1')) ?: '1',
                    'unit' => trim((string) ($cat['unit'] ?? 'Ls')) ?: 'Ls',
                    'subtotal' => $itemSubtotal,
                    'items' => $normalizedItems,
                ];
                $catIndex++;
            }
        }

        return $normalized;
    }

    private function prepareRekapitulasiForPdf(mixed $groups, bool $pakaiPpn, float $ppnPersen): array
    {
        if (!is_array($groups) || empty($groups)) {
            return [
                'groups' => [],
                'total' => 0,
                'total_formatted' => 'Rp 0',
                'vat' => 0,
                'vat_formatted' => 'Rp 0',
                'grand_total' => 0,
                'grand_total_formatted' => 'Rp 0',
            ];
        }

        $formattedGroups = [];
        $total = 0;

        foreach ($groups as $cat) {
            $catSubtotal = 0;
            $items = [];
            foreach ($cat['items'] ?? [] as $item) {
                $vol = (float) ($item['vol'] ?? 1);
                $material = (int) ($item['material'] ?? 0);
                $jasa = (int) ($item['jasa'] ?? 0);
                $totalItem = (int) ($item['total_harga'] ?? round($vol * ($material + $jasa)));
                $catSubtotal += $totalItem;

                $items[] = [
                    'nomor' => $item['nomor'] ?? '',
                    'deskripsi' => $item['deskripsi'] ?? '',
                    'satuan' => $item['satuan'] ?? '',
                    'vol' => (fmod($vol, 1.0) == 0.0) ? (string) (int) $vol : str_replace('.', ',', (string) $vol),
                    'material' => $material,
                    'material_formatted' => $material > 0 ? $this->formatRupiah($material) : '-',
                    'jasa' => $jasa,
                    'jasa_formatted' => $jasa > 0 ? $this->formatRupiah($jasa) : '-',
                    'total_harga' => $totalItem,
                    'total_harga_formatted' => $this->formatRupiah($totalItem),
                ];
            }

            $total += $catSubtotal;
            $formattedGroups[] = [
                'nomor_romawi' => $cat['nomor_romawi'] ?? '',
                'judul_kategori' => $cat['judul_kategori'] ?? '',
                'subtotal' => $catSubtotal,
                'subtotal_formatted' => $this->formatRupiah($catSubtotal),
                'items' => $items,
            ];
        }

        $vat = $pakaiPpn ? (int) round($total * ($ppnPersen / 100)) : 0;
        $grandTotal = $total + $vat;

        return [
            'groups' => $formattedGroups,
            'total' => $total,
            'total_formatted' => $this->formatRupiah($total),
            'vat' => $vat,
            'vat_formatted' => $this->formatRupiah($vat),
            'grand_total' => $grandTotal,
            'grand_total_formatted' => $this->formatRupiah($grandTotal),
        ];
    }

    private function sanitizeHtml(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        $allowed = strip_tags($html, '<p><br><strong><b><em><i><u><ol><ul><li><span><img><figure><figcaption>');

        return preg_replace_callback(
            '/<img\b[^>]*>/i',
            fn (array $match) => $this->sanitizeImgTag($match[0]),
            $allowed
        );
    }

    private function sanitizeImgTag(string $tag): string
    {
        if (! preg_match('/src\s*=\s*["\']([^"\']+)["\']/i', $tag, $match)) {
            return '';
        }

        $src = html_entity_decode($match[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $isDataImage = (bool) preg_match('/^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+\/=]+$/i', $src);
        $isHttp = (bool) preg_match('#^https?://#i', $src);
        $isStorage = str_starts_with($src, '/storage/');

        if (! $isDataImage && ! $isHttp && ! $isStorage) {
            return '';
        }

        $safeSrc = htmlspecialchars($src, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return '<img src="'.$safeSrc.'" alt="" style="max-width:180px;max-height:140px;height:auto;display:block;margin:6px 0;" />';
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
     * Gambar dipertahankan (placeholder) agar tidak hilang saat strip HTML.
     */
    private function richHtmlToPdfCell(string $html): string
    {
        $html = trim($html);
        if ($html === '') {
            return '';
        }

        $images = [];
        $html = preg_replace_callback('/<img\b[^>]*>/i', function (array $match) use (&$images) {
            $token = '%%SPHIMG'.count($images).'%%';
            $images[$token] = $this->sanitizeImgTag($match[0]);

            return $token;
        }, $html) ?? $html;

        $converted = '';

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
                $converted = implode('<br>', $lines);
            }
        }

        if ($converted === '' && preg_match('/<p[\s>]|<figure[\s>]/i', $html)) {
            preg_match_all('/<(?:p|figure)[^>]*>(.*?)<\/(?:p|figure)>/is', $html, $matches);
            $lines = [];

            foreach ($matches[1] ?? [] as $chunk) {
                $text = $this->plainTextFromHtmlFragment($chunk);
                if ($text !== '') {
                    $lines[] = e($text);
                }
            }

            if ($lines !== []) {
                $converted = implode('<br>', $lines);
            }
        }

        if ($converted === '') {
            $plain = $this->plainTextFromHtmlFragment($html);
            $converted = $plain !== '' ? e($plain) : '';
        }

        if ($images === []) {
            return $converted;
        }

        return str_replace(array_keys($images), array_values($images), $converted);
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
