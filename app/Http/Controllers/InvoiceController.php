<?php

namespace App\Http\Controllers;

use App\Models\InvoiceDocument;
use App\Services\BeritaAcaraPdfAssetService;
use App\Services\SignatureStampMerger;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use App\Http\Controllers\Concerns\ResolvesWhatsAppDivisi;
use App\Http\Controllers\Concerns\SavesDocumentToProjectFolder;

class InvoiceController extends Controller
{
    use ResolvesWhatsAppDivisi;
    use SavesDocumentToProjectFolder;

    private const DEFAULT_CATATAN = "Pembayaran : 7641749137\nBANK BCA a/n PT. HAYATI\nSEMESTA RAHARJA";
    private const DEFAULT_CATATAN_NON_PPN = "Non PPN\nPembayaran : 8880253302\nBANK BCA an SYAHRUL ROJI";

    private function ensureSuperAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user || ($user->role ?? null) !== 'super_admin') {
            abort(403, 'Hanya Super Admin yang dapat mengakses Invoice.');
        }
    }

    private function generateNomorSurat(?string $tanggalInvoice = null): array
    {
        $date = $this->parseFlexibleDate($tanggalInvoice) ?? Carbon::now();
        $tahun = (int) $date->year;

        $lastDocument = InvoiceDocument::orderBy('nomor_urut', 'desc')->first();
        $nomorUrut = $lastDocument ? ((int) $lastDocument->nomor_urut + 1) : 1;
        $nomorSurat = sprintf('%dINV-DIVPRO/HSR/%s', $nomorUrut, $date->format('dmY'));

        return [
            'nomor_surat' => $nomorSurat,
            'nomor_urut' => $nomorUrut,
            'tahun' => $tahun,
        ];
    }

    public function getNextNomorSurat(Request $request)
    {
        $this->ensureSuperAdmin($request);

        $tanggal = $request->query('tanggal_invoice');

        return response()->json($this->generateNomorSurat($tanggal));
    }

    public function getHistory(Request $request)
    {
        $this->ensureSuperAdmin($request);

        return response()->json([
            'data' => InvoiceDocument::orderBy('created_at', 'desc')->get(),
        ]);
    }

    public function generatePDF(Request $request)
    {
        $this->ensureSuperAdmin($request);
        $validated = $this->validatePayload($request);
        $nomorData = $this->generateNomorSurat($validated['tanggal_invoice'] ?? null);
        $attrs = $this->buildDocumentAttributes($validated);

        $document = InvoiceDocument::create(array_merge($attrs, [
            'nomor_surat' => $nomorData['nomor_surat'],
            'nomor_urut' => $nomorData['nomor_urut'],
            'tahun' => $nomorData['tahun'],
        ]));

        app(WhatsAppService::class)->notifyDocumentCreated(
            'Invoice',
            $validated['bill_to_nama'],
            $nomorData['nomor_surat'],
            $this->whatsAppDivisiFromRequest($request)
        );

        return $this->generatePDFResponse($this->documentToPdfData($document), $validated['projek_kerja_id'] ?? null);
    }

    public function show(Request $request, $id)
    {
        $this->ensureSuperAdmin($request);

        return response()->json([
            'success' => true,
            'data' => InvoiceDocument::findOrFail($id),
        ]);
    }

    public function update(Request $request, $id)
    {
        $this->ensureSuperAdmin($request);
        $validated = $this->validatePayload($request);
        $document = InvoiceDocument::findOrFail($id);
        $document->update($this->buildDocumentAttributes($validated));

        return response()->json([
            'success' => true,
            'message' => 'Dokumen Invoice berhasil diperbarui',
            'data' => $document->fresh(),
        ]);
    }

    public function regeneratePDF(Request $request, $id)
    {
        $this->ensureSuperAdmin($request);

        return $this->generatePDFResponse($this->documentToPdfData(InvoiceDocument::findOrFail($id)));
    }

    public function destroy(Request $request, $id)
    {
        $this->ensureSuperAdmin($request);

        try {
            InvoiceDocument::findOrFail($id)->delete();

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
            'tanggal_invoice' => 'required|string',
            'tanggal_jatuh_tempo' => 'nullable|string',
            'bill_to_nama' => 'required|string|max:255',
            'bill_to_alamat' => 'nullable|string|max:20000',
            'bill_to_telepon' => 'nullable|string|max:100',
            'items' => 'required|array|min:1',
            'items.*.nama_item' => 'required|string|max:500',
            'items.*.unit' => 'nullable|string|max:50',
            'items.*.qty' => 'required|numeric|min:1',
            'items.*.harga' => 'required|numeric|min:0',
            'diskon_nominal' => 'nullable|numeric|min:0',
            'ppn_persen' => 'nullable|numeric|min:0|max:100',
            'catatan' => 'nullable|string|max:20000',
            'terms' => 'nullable|string|max:20000',
            'nama_penandatangan' => 'nullable|string|max:255',
            'jabatan_penandatangan' => 'nullable|string|max:255',
            'projek_kerja_id' => 'nullable|integer|exists:projek_kerjas,id',
        ]);
    }

    public function buildDocumentAttributes(array $validated): array
    {
        $items = $this->normalizeItems($validated['items']);
        $subtotal = $this->calculateSubtotal($items);
        $diskonNominal = min($subtotal, (int) round($validated['diskon_nominal'] ?? 0));
        $diskonPersen = $subtotal > 0 ? round(($diskonNominal / $subtotal) * 100, 2) : 0;
        $dpp = max(0, $subtotal - $diskonNominal);
        $ppnPersen = (float) ($validated['ppn_persen'] ?? 11);
        $ppnNominal = (int) round($dpp * ($ppnPersen / 100));

        return [
            'tanggal_invoice' => $validated['tanggal_invoice'],
            'tanggal_jatuh_tempo' => trim((string) ($validated['tanggal_jatuh_tempo'] ?? '')) ?: null,
            'bill_to_nama' => $validated['bill_to_nama'],
            'bill_to_alamat' => trim((string) ($validated['bill_to_alamat'] ?? '')) ?: null,
            'bill_to_telepon' => trim((string) ($validated['bill_to_telepon'] ?? '')) ?: null,
            'items' => $items,
            'subtotal' => $subtotal,
            'diskon_persen' => $diskonPersen,
            'diskon_nominal' => $diskonNominal,
            'ppn_persen' => $ppnPersen,
            'ppn_nominal' => $ppnNominal,
            'total_harga' => $dpp + $ppnNominal,
            'catatan' => trim((string) ($validated['catatan'] ?? '')) ?: ($ppnPersen > 0 ? self::DEFAULT_CATATAN : self::DEFAULT_CATATAN_NON_PPN),
            'terms' => trim((string) ($validated['terms'] ?? '')) ?: null,
            'nama_penandatangan' => trim((string) ($validated['nama_penandatangan'] ?? '')) ?: 'SYAHRUL ROJI',
            'jabatan_penandatangan' => trim((string) ($validated['jabatan_penandatangan'] ?? '')) ?: 'DIREKTUR',
        ];
    }

    private function documentToPdfData(InvoiceDocument $document): array
    {
        $items = collect($document->items ?? [])->map(function ($item) {
            $harga = (int) ($item['harga'] ?? 0);
            $qty = max(1, (int) ($item['qty'] ?? 1));
            $amount = (int) ($item['amount'] ?? ($harga * $qty));

            return array_merge($item, [
                'harga_formatted' => $this->formatRupiah($harga),
                'amount_formatted' => $this->formatRupiah($amount),
                'harga_number' => number_format($harga, 0, ',', '.'),
                'amount_number' => number_format($amount, 0, ',', '.'),
            ]);
        })->all();

        return [
            'nomor_surat' => $document->nomor_surat,
            'tanggal_invoice' => $document->tanggal_invoice,
            'tanggal_jatuh_tempo' => $document->tanggal_jatuh_tempo,
            'bill_to_nama' => $document->bill_to_nama,
            'bill_to_alamat' => $document->bill_to_alamat,
            'bill_to_telepon' => $document->bill_to_telepon,
            'items' => $items,
            'subtotal' => $document->subtotal,
            'subtotal_number' => number_format((int) $document->subtotal, 0, ',', '.'),
            'diskon_persen' => $document->diskon_persen,
            'diskon_nominal' => $document->diskon_nominal,
            'diskon_number' => number_format((int) $document->diskon_nominal, 0, ',', '.'),
            'ppn_persen' => $document->ppn_persen,
            'ppn_nominal' => $document->ppn_nominal,
            'ppn_number' => number_format((int) $document->ppn_nominal, 0, ',', '.'),
            'total_harga' => $document->total_harga,
            'total_harga_formatted' => $this->formatRupiah((int) $document->total_harga),
            'total_number' => number_format((int) $document->total_harga, 0, ',', '.'),
            'catatan' => $document->catatan ?: ((float) $document->ppn_persen > 0 ? self::DEFAULT_CATATAN : self::DEFAULT_CATATAN_NON_PPN),
            'terms' => $document->terms,
            'nama_penandatangan' => $document->nama_penandatangan ?: 'SYAHRUL ROJI',
            'jabatan_penandatangan' => $document->jabatan_penandatangan ?: 'DIREKTUR',
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

        $html = view('pdf.invoice', $data)->render();
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'INVOICE-' . str_replace('/', '-', $data['nomor_surat']) . '.pdf';
        $pdfOutput = $dompdf->output();

        $this->saveDocumentPdfToProjectFolder($projekKerjaId, $pdfOutput, $filename, 'Invoice');

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
                'nama_item' => trim((string) ($item['nama_item'] ?? '')),
                'unit' => trim((string) ($item['unit'] ?? '')) ?: 'pcs',
                'qty' => $qty,
                'harga' => $harga,
                'amount' => $harga * $qty,
            ];
        })->all();
    }

    private function calculateSubtotal(array $items): int
    {
        return (int) collect($items)->sum('amount');
    }

    private function parseFlexibleDate(?string $value): ?Carbon
    {
        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function formatRupiah(int $amount): string
    {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }
}
