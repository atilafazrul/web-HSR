<?php

namespace App\Http\Controllers;

use App\Models\PoDocument;
use App\Services\BeritaAcaraPdfAssetService;
use App\Services\SignatureStampMerger;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ResolvesWhatsAppDivisi;

class POController extends Controller
{
    use ResolvesWhatsAppDivisi;

    private const DEFAULT_SHIP_TO_NAMA = 'PT. HAYATI SEMESTA RAHARJA';
    private const DEFAULT_SHIP_TO_ALAMAT = "Jl Raya Pasar Kemis Kp Picung RT 04/05 No. 86\nDs Pasar Kemis Kec Pasar Kemis Kab Tangerang\nBanten 15560";

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

        $lastDocument = PoDocument::where('tahun', $tahun)
            ->where('bulan', $bulan)
            ->orderBy('nomor_urut', 'desc')
            ->first();

        $nomorUrut = $lastDocument ? $lastDocument->nomor_urut + 1 : 1;
        $nomorSurat = sprintf('%03d/BHP/HSR/%s/%d', $nomorUrut, $bulanRomawi, $tahun);

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
        return response()->json($this->generateNomorSurat());
    }

    public function getHistory()
    {
        return response()->json([
            'data' => PoDocument::orderBy('created_at', 'desc')->get(),
        ]);
    }

    public function generatePDF(Request $request)
    {
        $validated = $this->validatePayload($request);
        $nomorData = $this->generateNomorSurat();
        $attrs = $this->buildDocumentAttributes($validated);

        $document = PoDocument::create(array_merge($attrs, [
            'nomor_surat' => $nomorData['nomor_surat'],
            'nomor_urut' => $nomorData['nomor_urut'],
            'bulan' => $nomorData['bulan'],
            'tahun' => $nomorData['tahun'],
        ]));

        app(WhatsAppService::class)->notifyDocumentCreated(
            'PO',
            $validated['to_nama'],
            $nomorData['nomor_surat'],
            $this->whatsAppDivisiFromRequest($request)
        );

        return $this->generatePDFResponse($this->documentToPdfData($document));
    }

    public function show($id)
    {
        return response()->json([
            'success' => true,
            'data' => PoDocument::findOrFail($id),
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $this->validatePayload($request);
        $document = PoDocument::findOrFail($id);
        $document->update($this->buildDocumentAttributes($validated));

        return response()->json([
            'success' => true,
            'message' => 'Dokumen PO berhasil diperbarui',
            'data' => $document->fresh(),
        ]);
    }

    public function regeneratePDF($id)
    {
        return $this->generatePDFResponse($this->documentToPdfData(PoDocument::findOrFail($id)));
    }

    public function destroy($id)
    {
        try {
            PoDocument::findOrFail($id)->delete();

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
            'tanggal_po' => 'required|string',
            'to_nama' => 'required|string|max:255',
            'to_alamat' => 'nullable|string|max:5000',
            'ship_to_nama' => 'nullable|string|max:255',
            'ship_to_alamat' => 'nullable|string|max:5000',
            'fob' => 'nullable|string|max:255',
            'shipped_via' => 'nullable|string|max:255',
            'payment_term' => 'nullable|string|max:255',
            'items' => 'required|array|min:1',
            'items.*.kode_item' => 'nullable|string|max:100',
            'items.*.deskripsi' => 'required|string',
            'items.*.qty' => 'required|numeric|min:1',
            'items.*.harga' => 'required|numeric|min:0',
            'ppn_persen' => 'nullable|numeric|min:0|max:100',
            'kota_tanda_tangan' => 'nullable|string|max:100',
            'nama_penandatangan' => 'nullable|string|max:150',
            'jabatan_penandatangan' => 'nullable|string|max:150',
            'projek_kerja_id' => 'nullable|integer|exists:projek_kerjas,id',
        ]);
    }

    public function buildDocumentAttributes(array $validated): array
    {
        $items = $this->normalizeItems($validated['items']);
        $subtotal = $this->calculateSubtotal($items);
        $ppnPersen = (float) ($validated['ppn_persen'] ?? 11);
        $ppnNominal = (int) round($subtotal * ($ppnPersen / 100));

        return [
            'tanggal_po' => $validated['tanggal_po'],
            'to_nama' => $validated['to_nama'],
            'to_alamat' => trim((string) ($validated['to_alamat'] ?? '')) ?: null,
            'ship_to_nama' => trim((string) ($validated['ship_to_nama'] ?? '')) ?: self::DEFAULT_SHIP_TO_NAMA,
            'ship_to_alamat' => trim((string) ($validated['ship_to_alamat'] ?? '')) ?: self::DEFAULT_SHIP_TO_ALAMAT,
            'fob' => trim((string) ($validated['fob'] ?? '')) ?: null,
            'shipped_via' => trim((string) ($validated['shipped_via'] ?? '')) ?: null,
            'payment_term' => trim((string) ($validated['payment_term'] ?? '')) ?: 'Cash On Delivery',
            'items' => $items,
            'subtotal' => $subtotal,
            'ppn_persen' => $ppnPersen,
            'ppn_nominal' => $ppnNominal,
            'total_harga' => $subtotal + $ppnNominal,
            'kota_tanda_tangan' => trim((string) ($validated['kota_tanda_tangan'] ?? '')) ?: 'Tangerang',
            'nama_penandatangan' => trim((string) ($validated['nama_penandatangan'] ?? '')) ?: 'Syahrul Roji',
            'jabatan_penandatangan' => trim((string) ($validated['jabatan_penandatangan'] ?? '')) ?: null,
        ];
    }

    private function documentToPdfData(PoDocument $document): array
    {
        $items = collect($document->items ?? [])->map(function ($item) {
            $harga = (int) ($item['harga'] ?? 0);
            $qty = max(1, (int) ($item['qty'] ?? 1));
            $total = (int) ($item['total_harga'] ?? ($harga * $qty));

            return array_merge($item, [
                'harga_formatted' => $this->formatRupiah($harga),
                'total_harga_formatted' => $this->formatRupiah($total),
                'deskripsi_html' => $this->deskripsiToHtml(
                    trim(($item['kode_item'] ?? '') . "\n" . ($item['deskripsi'] ?? ''))
                ),
            ]);
        })->all();

        return [
            'nomor_surat' => $document->nomor_surat,
            'tanggal_po' => $document->tanggal_po,
            'to_nama' => $document->to_nama,
            'to_alamat' => $document->to_alamat,
            'ship_to_nama' => $document->ship_to_nama,
            'ship_to_alamat' => $document->ship_to_alamat,
            'fob' => $document->fob,
            'shipped_via' => $document->shipped_via,
            'payment_term' => $document->payment_term,
            'items' => $items,
            'subtotal' => $document->subtotal,
            'subtotal_formatted' => $this->formatRupiah((int) $document->subtotal),
            'ppn_persen' => $document->ppn_persen,
            'ppn_nominal' => $document->ppn_nominal,
            'ppn_formatted' => $this->formatRupiah((int) $document->ppn_nominal),
            'total_harga' => $document->total_harga,
            'total_harga_formatted' => $this->formatRupiah((int) $document->total_harga),
            'kota_tanda_tangan' => $document->kota_tanda_tangan ?: 'Tangerang',
            'nama_penandatangan' => $document->nama_penandatangan ?: 'Syahrul Roji',
            'jabatan_penandatangan' => $document->jabatan_penandatangan,
        ];
    }

    private function generatePDFResponse(array $data)
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);
        $data = app(BeritaAcaraPdfAssetService::class)->enrich($data);
        $data = $this->applySignatureAndCap($data);

        $html = view('pdf.po', $data)->render();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'PO-' . str_replace('/', '-', $data['nomor_surat']) . '.pdf';

        return response()->make($dompdf->output(), 200, [
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
        } elseif (!empty($signatureDataUrl)) {
            $data['ttd_penandatangan'] = $signatureDataUrl;
        }

        return $data;
    }

    private function normalizeItems(array $items): array
    {
        return collect($items)->values()->map(function ($item, $index) {
            $harga = (int) ($item['harga'] ?? 0);
            $qty = max(1, (int) ($item['qty'] ?? 1));

            return [
                'no' => $index + 1,
                'kode_item' => trim((string) ($item['kode_item'] ?? '')),
                'deskripsi' => trim((string) ($item['deskripsi'] ?? '')),
                'qty' => $qty,
                'harga' => $harga,
                'total_harga' => $harga * $qty,
            ];
        })->all();
    }

    private function calculateSubtotal(array $items): int
    {
        return (int) collect($items)->sum('total_harga');
    }

    private function deskripsiToHtml(string $deskripsi): string
    {
        $deskripsi = trim($deskripsi);
        if ($deskripsi === '') {
            return '';
        }

        $lines = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $deskripsi) ?: [])));
        if (count($lines) <= 1) {
            return e($deskripsi);
        }

        $first = '<strong>' . e(array_shift($lines)) . '</strong>';
        $rest = collect($lines)->map(fn ($line) => e($line))->implode('<br>');

        return $first . '<br>' . $rest;
    }

    public function formatRupiah(int $amount): string
    {
        return 'Rp. ' . number_format($amount, 0, ',', '.');
    }
}
