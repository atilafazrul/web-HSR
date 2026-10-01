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

    public static function resolveDivisiCode(?string $divisi): string
    {
        $d = strtolower(trim((string) $divisi));
        return match ($d) {
            'it', 'divisi it', 'divit', 'inv-divit' => 'INV-DIVIT',
            'sales', 'disal', 'divsal', 'divisi sales', 'inv-disal', 'inv-divsal' => 'INV-DIVSAL',
            'service', 'divser', 'divisi service', 'inv-divser' => 'INV-DIVSER',
            'bhp', 'barang habis pakai', 'barang habis pakai bhp', 'dipro', 'divpro', 'projek', 'divisi projek', 'inv-dipro', 'inv-divpro' => 'INV-DIVPRO',
            'kontraktor', 'divisi kontraktor', 'dikon', 'divkon', 'inv-dikon', 'inv-divkon' => 'INV-DIVKON',
            'logistik', 'divisi logistik', 'dilog', 'divlog', 'inv-dilog', 'inv-divlog' => 'INV-DIVLOG',
            'purchasing', 'divisi purchasing', 'dipur', 'divpur', 'inv-dipur', 'inv-divpur' => 'INV-DIVPUR',
            'siplah', 'divisi siplah', 'disip', 'divsip', 'inv-disip', 'inv-divsip' => 'INV-DIVSIP',
            default => 'INV-DIVPRO',
        };
    }

    private function generateNomorSurat(?string $tanggalInvoice = null, ?string $divisi = null): array
    {
        $date = $this->parseFlexibleDate($tanggalInvoice) ?? Carbon::now();
        $tahun = (int) $date->year;
        $divisiCode = $this->resolveDivisiCode($divisi);

        // Cari nomor urut tertinggi secara GLOBAL (semua divisi) pada tahun yang sama
        $maxUrut = InvoiceDocument::where('tahun', $tahun)->max('nomor_urut');

        if ($maxUrut === null) {
            $maxUrut = InvoiceDocument::max('nomor_urut');
        }

        $nomorUrut = $maxUrut !== null ? ((int) $maxUrut + 1) : 1;

        // Pastikan nomor urut & nomor surat belum pernah dipakai di divisi manapun
        do {
            $nomorSurat = sprintf('%03d/%s/HSR/%s', $nomorUrut, $divisiCode, $date->format('dmY'));
            $suratExists = InvoiceDocument::where('nomor_surat', $nomorSurat)->exists();
            $urutExists = InvoiceDocument::where('tahun', $tahun)
                ->where('nomor_urut', $nomorUrut)
                ->exists();

            if ($suratExists || $urutExists) {
                $nomorUrut++;
            }
        } while ($suratExists || $urutExists);

        return [
            'nomor_surat' => $nomorSurat,
            'nomor_urut' => $nomorUrut,
            'tahun' => $tahun,
            'divisi_code' => $divisiCode,
        ];
    }

    public function getNextNomorSurat(Request $request)
    {
        $this->ensureSuperAdmin($request);

        $tanggal = $request->query('tanggal_invoice');
        $divisi = $request->query('divisi');

        if (!$divisi && $request->filled('projek_kerja_id')) {
            $projek = \App\Models\ProjekKerja::find($request->query('projek_kerja_id'));
            if ($projek && $projek->divisi) {
                $divisi = $projek->divisi;
            }
        }

        $data = $this->generateNomorSurat($tanggal, $divisi);
        $data['nomor_urut_formatted'] = sprintf('%03d', (int) $data['nomor_urut']);

        return response()->json($data);
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
        $nomorData = $this->generateNomorSurat(
            $validated['tanggal_invoice'] ?? null,
            $validated['divisi'] ?? null
        );
        $attrs = $this->buildDocumentAttributes($validated);

        $nomorUrutInt = $nomorData['nomor_urut'];
        $nomorSurat = $nomorData['nomor_surat'];

        if (!empty($validated['nomor_urut'])) {
            $rawUrut = trim((string) $validated['nomor_urut']);
            if (ctype_digit($rawUrut)) {
                $nomorUrutInt = (int) $rawUrut;
                $divisiCode = $this->resolveDivisiCode($validated['divisi'] ?? null);
                $date = $this->parseFlexibleDate($validated['tanggal_invoice'] ?? null) ?? Carbon::now();
                $nomorSurat = sprintf('%03d/%s/HSR/%s', $nomorUrutInt, $divisiCode, $date->format('dmY'));
            }
        }

        if (!empty($validated['nomor_surat'])) {
            $nomorSurat = trim($validated['nomor_surat']);
        }

        $divisi = $validated['divisi'] ?? null;
        $divisiCode = $this->resolveDivisiCode($divisi);
        $tahun = $nomorData['tahun'];

        // Cek apakah nomor_surat sudah terdaftar
        $existingSurat = InvoiceDocument::where('nomor_surat', $nomorSurat)->first();
        if ($existingSurat) {
            return response()->json([
                'success' => false,
                'message' => "Nomor invoice '{$nomorSurat}' sudah terdaftar. Tidak bisa menggunakan nomor yang sama.",
                'errors' => [
                    'nomor_surat' => ["Nomor invoice '{$nomorSurat}' sudah terdaftar."],
                    'nomor_urut' => ["Nomor urut " . sprintf('%03d', $nomorUrutInt) . " sudah terpakai."],
                ],
            ], 422);
        }

        // Cek apakah nomor_urut sudah terdaftar secara global (meskipun divisi berbeda)
        $existingUrut = InvoiceDocument::where('tahun', $tahun)
            ->where('nomor_urut', $nomorUrutInt)
            ->first();

        if ($existingUrut) {
            $formattedUrut = sprintf('%03d', $nomorUrutInt);
            $divisiName = $existingUrut->divisi ? strtoupper($existingUrut->divisi) : 'lain';
            return response()->json([
                'success' => false,
                'message' => "Nomor urut {$formattedUrut} sudah digunakan pada divisi {$divisiName} ({$existingUrut->nomor_surat}). Meskipun divisi berbeda, nomor urut tidak boleh kembar.",
                'errors' => [
                    'nomor_urut' => ["Nomor urut {$formattedUrut} sudah digunakan pada dokumen {$existingUrut->nomor_surat}."],
                ],
            ], 422);
        }

        try {
            $document = InvoiceDocument::create(array_merge($attrs, [
                'divisi' => $validated['divisi'] ?? null,
                'nomor_surat' => $nomorSurat,
                'nomor_urut' => $nomorUrutInt,
                'tahun' => $tahun,
            ]));
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == 23000) {
                return response()->json([
                    'success' => false,
                    'message' => "Nomor invoice '{$nomorSurat}' sudah terdaftar di sistem. Silakan gunakan nomor lain.",
                    'errors' => [
                        'nomor_surat' => ["Nomor invoice '{$nomorSurat}' sudah ada."],
                    ],
                ], 422);
            }
            throw $e;
        }

        app(WhatsAppService::class)->notifyDocumentCreated(
            'Invoice',
            $validated['bill_to_nama'],
            $nomorSurat,
            $validated['divisi'] ?? $this->whatsAppDivisiFromRequest($request)
        );

        $pdfData = $this->documentToPdfData($document);
        $pdfData['pakai_ttd'] = $validated['pakai_ttd'] ?? true;

        return $this->generatePDFResponse($pdfData, $validated['projek_kerja_id'] ?? null);
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

        $attrs = $this->buildDocumentAttributes($validated);
        $activeDivisi = $validated['divisi'] ?? $document->divisi;
        $divisiCode = $this->resolveDivisiCode($activeDivisi);
        $date = $this->parseFlexibleDate($validated['tanggal_invoice'] ?? $document->tanggal_invoice) ?? Carbon::now();
        $tahun = (int) $date->year;

        $nomorUrutInt = $document->nomor_urut;
        $nomorSurat = $document->nomor_surat;

        if (!empty($validated['nomor_urut'])) {
            $rawUrut = trim((string) $validated['nomor_urut']);
            if (ctype_digit($rawUrut)) {
                $nomorUrutInt = (int) $rawUrut;
                $nomorSurat = sprintf('%03d/%s/HSR/%s', $nomorUrutInt, $divisiCode, $date->format('dmY'));
                $attrs['nomor_urut'] = $nomorUrutInt;
                $attrs['nomor_surat'] = $nomorSurat;
            }
        }

        if (!empty($validated['nomor_surat'])) {
            $nomorSurat = trim($validated['nomor_surat']);
            $attrs['nomor_surat'] = $nomorSurat;
        }

        // Cek duplikasi nomor surat pada dokumen lain
        $existingSurat = InvoiceDocument::where('nomor_surat', $nomorSurat)
            ->where('id', '!=', $id)
            ->first();

        if ($existingSurat) {
            return response()->json([
                'success' => false,
                'message' => "Nomor invoice '{$nomorSurat}' sudah terdaftar pada dokumen lain.",
                'errors' => [
                    'nomor_surat' => ["Nomor invoice '{$nomorSurat}' sudah terdaftar."],
                    'nomor_urut' => ["Nomor urut " . sprintf('%03d', $nomorUrutInt) . " sudah terpakai."],
                ],
            ], 422);
        }

        // Cek duplikasi nomor urut secara global pada dokumen lain (meskipun divisi berbeda)
        $existingUrut = InvoiceDocument::where('tahun', $tahun)
            ->where('nomor_urut', $nomorUrutInt)
            ->where('id', '!=', $id)
            ->first();

        if ($existingUrut) {
            $formattedUrut = sprintf('%03d', $nomorUrutInt);
            $divisiName = $existingUrut->divisi ? strtoupper($existingUrut->divisi) : 'lain';
            return response()->json([
                'success' => false,
                'message' => "Nomor urut {$formattedUrut} sudah digunakan pada divisi {$divisiName} ({$existingUrut->nomor_surat}). Meskipun divisi berbeda, nomor urut tidak boleh kembar.",
                'errors' => [
                    'nomor_urut' => ["Nomor urut {$formattedUrut} sudah digunakan pada dokumen {$existingUrut->nomor_surat}."],
                ],
            ], 422);
        }

        try {
            $document->update($attrs);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == 23000) {
                return response()->json([
                    'success' => false,
                    'message' => "Nomor invoice '{$nomorSurat}' sudah terdaftar di sistem. Silakan gunakan nomor lain.",
                    'errors' => [
                        'nomor_surat' => ["Nomor invoice '{$nomorSurat}' sudah ada."],
                    ],
                ], 422);
            }
            throw $e;
        }

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
            'divisi' => 'nullable|string|max:50',
            'nomor_urut' => 'nullable|string|max:50',
            'nomor_surat' => 'nullable|string|max:255',
            'tanggal_invoice' => 'required|string',
            'tanggal_jatuh_tempo' => 'nullable|string',
            'no_po' => 'nullable|string|max:255',
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
            'pakai_ttd' => 'nullable|boolean',
            'pakai_cap' => 'nullable|boolean',
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

        $attrs = [
            'divisi' => trim((string) ($validated['divisi'] ?? '')) ?: null,
            'tanggal_invoice' => $validated['tanggal_invoice'],
            'tanggal_jatuh_tempo' => trim((string) ($validated['tanggal_jatuh_tempo'] ?? '')) ?: null,
            'no_po' => trim((string) ($validated['no_po'] ?? '')) ?: null,
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
            'pakai_ttd' => isset($validated['pakai_ttd']) ? (bool) $validated['pakai_ttd'] : true,
            'pakai_cap' => isset($validated['pakai_cap']) ? (bool) $validated['pakai_cap'] : true,
        ];

        if (array_key_exists('projek_kerja_id', $validated)) {
            $attrs['projek_kerja_id'] = $validated['projek_kerja_id'];
        }

        return $attrs;
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
            'divisi' => $document->divisi,
            'nomor_surat' => $document->nomor_surat,
            'tanggal_invoice' => $document->tanggal_invoice,
            'tanggal_jatuh_tempo' => $document->tanggal_jatuh_tempo,
            'no_po' => $document->no_po,
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
            'pakai_ttd' => $document->pakai_ttd ?? true,
            'pakai_cap' => $document->pakai_cap ?? true,
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
        $pakaiTtd = ($data['pakai_ttd'] ?? true) !== false;
        $pakaiCap = ($data['pakai_cap'] ?? true) !== false;

        // Tidak ada yang dipakai — kembalikan tanpa perubahan
        if (!$pakaiTtd && !$pakaiCap) {
            return $data;
        }

        $signaturePath = public_path('images/TTD Direktur.png');
        $capStampPath  = public_path('images/Cap HSR.png');

        $signatureDataUrl = null;
        if ($pakaiTtd && file_exists($signaturePath)) {
            $signatureDataUrl = 'data:image/png;base64,' . base64_encode(file_get_contents($signaturePath));
        }

        $capDataUrl = null;
        if ($pakaiCap && file_exists($capStampPath)) {
            $capDataUrl = 'data:image/png;base64,' . base64_encode(file_get_contents($capStampPath));
        }

        if (!empty($signatureDataUrl) && !empty($capDataUrl)) {
            // TTD + Cap: gabungkan
            $merger = new SignatureStampMerger();
            $data['ttd_penandatangan'] = $merger->merge($signatureDataUrl, $capDataUrl);
        } elseif (!empty($capDataUrl)) {
            // Cap saja (tanpa TTD): merge dengan signature null
            $merger = new SignatureStampMerger();
            $data['ttd_penandatangan'] = $merger->merge(null, $capDataUrl);
        } elseif (!empty($signatureDataUrl)) {
            // TTD saja (tanpa Cap)
            $merger = new SignatureStampMerger();
            $data['ttd_penandatangan'] = $merger->normalizeSignature($signatureDataUrl);
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

        $idMonths = [
            'januari' => 'january', 'februari' => 'february', 'maret' => 'march',
            'april' => 'april', 'mei' => 'may', 'juni' => 'june',
            'juli' => 'july', 'agustus' => 'august', 'september' => 'september',
            'oktober' => 'october', 'november' => 'november', 'desember' => 'december',
        ];

        $normalized = str_ireplace(array_keys($idMonths), array_values($idMonths), $value);

        try {
            return Carbon::parse($normalized);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function formatRupiah(int $amount): string
    {
        return 'Rp ' . number_format($amount, 0, ',', '.');
    }
}
