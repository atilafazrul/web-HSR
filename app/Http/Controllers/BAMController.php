<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Dompdf\Dompdf;
use Dompdf\Options;
use Carbon\Carbon;
use App\Models\BamDocument;

class BAMController extends Controller
{
    /**
     * Convert angka bulan ke romawi.
     */
    private function bulanToRomawi($bulan)
    {
        $romawi = [
            1 => 'I',
            2 => 'II',
            3 => 'III',
            4 => 'IV',
            5 => 'V',
            6 => 'VI',
            7 => 'VII',
            8 => 'VIII',
            9 => 'IX',
            10 => 'X',
            11 => 'XI',
            12 => 'XII'
        ];

        return $romawi[$bulan] ?? 'I';
    }

    /**
     * Generate nomor surat otomatis.
     */
    private function generateNomorSurat()
    {
        $now = Carbon::now();
        $tahun = $now->year;
        $bulan = $now->month;
        $bulanRomawi = $this->bulanToRomawi($bulan);

        // Cari nomor urut terakhir untuk bulan dan tahun ini
        $lastDocument = BamDocument::where('tahun', $tahun)
            ->where('bulan', $bulan)
            ->orderBy('nomor_urut', 'desc')
            ->first();

        $nomorUrut = $lastDocument ? $lastDocument->nomor_urut + 1 : 1;

        // Format: 001/BAM-HSR/III/2026
        $nomorSurat = sprintf('%03d/BAM-HSR/%s/%d', $nomorUrut, $bulanRomawi, $tahun);

        return [
            'nomor_surat' => $nomorSurat,
            'nomor_urut' => $nomorUrut,
            'bulan' => $bulan,
            'tahun' => $tahun,
            'bulan_romawi' => $bulanRomawi
        ];
    }

    /**
     * Get next nomor surat untuk preview.
     */
    public function getNextNomorSurat()
    {
        $nomorData = $this->generateNomorSurat();

        return response()->json([
            'nomor_surat' => $nomorData['nomor_surat'],
            'nomor_urut' => $nomorData['nomor_urut'],
            'bulan' => $nomorData['bulan'],
            'tahun' => $nomorData['tahun'],
            'bulan_romawi' => $nomorData['bulan_romawi']
        ]);
    }

    /**
     * Get riwayat BAM.
     */
    public function getHistory()
    {
        $documents = BamDocument::orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $documents
        ]);
    }

    /**
     * Generate PDF BAM.
     */
    public function generatePDF(Request $request)
    {
        $validated = $request->validate([
            'nama_hari' => 'required|string',
            'tanggal_bam' => 'required|string',
            'nama_klient' => 'required|string',
            'tanggal_tanda_tangan' => 'required|string',
            'ttd_hsr' => 'nullable|string|max:500000',
            'ttd_klien' => 'nullable|string|max:500000',
            'nama_ttd_hsr' => 'nullable|string|max:150',
            'nama_ttd_klien' => 'nullable|string|max:150',
            'hasil' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.nama_alat' => 'required|string',
            'items.*.merk' => 'required|string',
            'items.*.jumlah' => 'required|string',
        ]);

        // Generate nomor surat otomatis
        $nomorData = $this->generateNomorSurat();

        // Simpan ke database
        $document = BamDocument::create([
            'nomor_surat' => $nomorData['nomor_surat'],
            'nama_hari' => $validated['nama_hari'],
            'tanggal_bam' => $validated['tanggal_bam'],
            'nama_klient' => $validated['nama_klient'],
            'tanggal_tanda_tangan' => $validated['tanggal_tanda_tangan'],
            'ttd_hsr' => $validated['ttd_hsr'] ?? null,
            'ttd_klien' => $validated['ttd_klien'] ?? null,
            'nama_ttd_hsr' => trim((string) ($validated['nama_ttd_hsr'] ?? '')) ?: null,
            'nama_ttd_klien' => trim((string) ($validated['nama_ttd_klien'] ?? '')) ?: null,
            'hasil' => $validated['hasil'],
            'items' => $validated['items'],
            'nomor_urut' => $nomorData['nomor_urut'],
            'bulan' => $nomorData['bulan'],
            'tahun' => $nomorData['tahun'],
        ]);

        $data = [
            'nomor_surat' => $nomorData['nomor_surat'],
            'nama_hari' => $validated['nama_hari'],
            'tanggal_bam' => $validated['tanggal_bam'],
            'nama_klient' => $validated['nama_klient'],
            'tanggal_tanda_tangan' => $validated['tanggal_tanda_tangan'],
            'ttd_hsr' => $validated['ttd_hsr'] ?? null,
            'ttd_klien' => $validated['ttd_klien'] ?? null,
            'nama_ttd_hsr' => trim((string) ($validated['nama_ttd_hsr'] ?? '')) ?: null,
            'nama_ttd_klien' => trim((string) ($validated['nama_ttd_klien'] ?? '')) ?: null,
            'hasil' => $validated['hasil'],
            'items' => $validated['items'],
        ];

        return $this->generatePDFResponse($data);
    }

    /**
     * Regenerate PDF dari history.
     */
    public function regeneratePDF($id)
    {
        $document = BamDocument::findOrFail($id);

        $data = [
            'nomor_surat' => $document->nomor_surat,
            'nama_hari' => $document->nama_hari,
            'tanggal_bam' => $document->tanggal_bam,
            'nama_klient' => $document->nama_klient,
            'tanggal_tanda_tangan' => $document->tanggal_tanda_tangan,
            'ttd_hsr' => $document->ttd_hsr,
            'ttd_klien' => $document->ttd_klien,
            'nama_ttd_hsr' => $document->nama_ttd_hsr,
            'nama_ttd_klien' => $document->nama_ttd_klien,
            'hasil' => $document->hasil ?? 'BAIK',
            'items' => $document->items,
        ];

        return $this->generatePDFResponse($data);
    }

    /**
     * Helper untuk generate PDF response.
     */
    private function generatePDFResponse($data)
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);

        // Encode logos to base64 for dompdf
        $hsrLogoPath = public_path('images/hsr logo.png');
        $isoLogoPath = public_path('images/iso logo.png');
        $medimageLogoPath = public_path('images/medimage logo.png');
        $medhisLogoPath = public_path('images/medhis.png');
        $mediserLogoPath = public_path('images/mediser logo.png');
        $conexaLogoPath = public_path('images/conexa.png');
        $mksLogoPath = public_path('images/mks logo.png');
        $watermarkPath = public_path('images/LOGO HSR.png');

        $hsrLogoBase64 = '';
        $isoLogoBase64 = '';
        $medimageLogoBase64 = '';
        $medhisLogoBase64 = '';
        $mediserLogoBase64 = '';
        $conexaLogoBase64 = '';
        $mksLogoBase64 = '';
        $watermarkBase64 = '';

        if (file_exists($hsrLogoPath)) {
            $hsrLogoData = base64_encode(file_get_contents($hsrLogoPath));
            $hsrLogoBase64 = 'data:image/png;base64,' . $hsrLogoData;
        }

        if (file_exists($isoLogoPath)) {
            $isoLogoData = base64_encode(file_get_contents($isoLogoPath));
            $isoLogoBase64 = 'data:image/png;base64,' . $isoLogoData;
        }

        if (file_exists($medimageLogoPath)) {
            $medimageLogoData = base64_encode(file_get_contents($medimageLogoPath));
            $medimageLogoBase64 = 'data:image/png;base64,' . $medimageLogoData;
        }

        if (file_exists($medhisLogoPath)) {
            $medhisLogoData = base64_encode(file_get_contents($medhisLogoPath));
            $medhisLogoBase64 = 'data:image/png;base64,' . $medhisLogoData;
        }

        if (file_exists($mediserLogoPath)) {
            $mediserLogoData = base64_encode(file_get_contents($mediserLogoPath));
            $mediserLogoBase64 = 'data:image/png;base64,' . $mediserLogoData;
        }

        if (file_exists($conexaLogoPath)) {
            $conexaLogoData = base64_encode(file_get_contents($conexaLogoPath));
            $conexaLogoBase64 = 'data:image/png;base64,' . $conexaLogoData;
        }

        if (file_exists($mksLogoPath)) {
            $mksLogoData = base64_encode(file_get_contents($mksLogoPath));
            $mksLogoBase64 = 'data:image/png;base64,' . $mksLogoData;
        }

        if (file_exists($watermarkPath)) {
            $watermarkData = base64_encode(file_get_contents($watermarkPath));
            $watermarkBase64 = 'data:image/png;base64,' . $watermarkData;
        }

        // Add logo variables to data
        $data['hsrLogo'] = $hsrLogoBase64;
        $data['isoLogo'] = $isoLogoBase64;
        $data['medimageLogo'] = $medimageLogoBase64;
        $data['medhisLogo'] = $medhisLogoBase64;
        $data['mediserLogo'] = $mediserLogoBase64;
        $data['conexaLogo'] = $conexaLogoBase64;
        $data['mksLogo'] = $mksLogoBase64;
        $data['watermark'] = $watermarkBase64;

        // Render view
        $html = view('pdf.bam', $data)->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'BAM-' . $data['nomor_surat'] . '.pdf';

        return response()->make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
    }

    /**
     * Delete BAM document.
     */
    public function destroy($id)
    {
        try {
            $document = BamDocument::findOrFail($id);
            $document->delete();

            return response()->json([
                'success' => true,
                'message' => 'Dokumen berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus dokumen'
            ], 500);
        }
    }
}

