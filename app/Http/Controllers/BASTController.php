<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Dompdf\Dompdf;
use Dompdf\Options;
use App\Models\BastDocument;
use Carbon\Carbon;

class BASTController extends Controller
{
    /**
     * Convert angka bulan ke romawi
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
     * Generate nomor surat otomatis
     */
    private function generateNomorSurat()
    {
        $now = Carbon::now();
        $tahun = $now->year;
        $bulan = $now->month;
        $bulanRomawi = $this->bulanToRomawi($bulan);
        
        // Cari nomor urut terakhir untuk bulan dan tahun ini
        $lastDocument = BastDocument::where('tahun', $tahun)
            ->where('bulan', $bulan)
            ->orderBy('nomor_urut', 'desc')
            ->first();
        
        $nomorUrut = $lastDocument ? $lastDocument->nomor_urut + 1 : 1;
        
        // Format: 001/BAST-HSR/III/2026
        $nomorSurat = sprintf('%03d/BAST-HSR/%s/%d', $nomorUrut, $bulanRomawi, $tahun);
        
        return [
            'nomor_surat' => $nomorSurat,
            'nomor_urut' => $nomorUrut,
            'bulan' => $bulan,
            'tahun' => $tahun,
            'bulan_romawi' => $bulanRomawi
        ];
    }

    /**
     * Get next nomor surat untuk preview
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
     * Get riwayat BAST
     */
    public function getHistory()
    {
        $documents = BastDocument::orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'data' => $documents
        ]);
    }

    /**
     * Generate PDF BAST
     */
    public function generatePDF(Request $request)
    {
        $validated = $request->validate([
            'nama_hari' => 'required|string',
            'tanggal_bast' => 'required|string',
            'nama_klient' => 'required|string',
            'tanggal_tanda_tangan' => 'required|string',
            'hasil' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.nama_alat' => 'required|string',
            'items.*.merk' => 'required|string',
            'items.*.jumlah' => 'required|string',
        ]);

        // Generate nomor surat otomatis
        $nomorData = $this->generateNomorSurat();

        // Simpan ke database
        $document = BastDocument::create([
            'nomor_surat' => $nomorData['nomor_surat'],
            'nama_hari' => $validated['nama_hari'],
            'tanggal_bast' => $validated['tanggal_bast'],
            'nama_klient' => $validated['nama_klient'],
            'tanggal_tanda_tangan' => $validated['tanggal_tanda_tangan'],
            'hasil' => $validated['hasil'],
            'items' => $validated['items'],
            'nomor_urut' => $nomorData['nomor_urut'],
            'bulan' => $nomorData['bulan'],
            'tahun' => $nomorData['tahun'],
        ]);

        $data = [
            'nomor_surat' => $nomorData['nomor_surat'],
            'nama_hari' => $validated['nama_hari'],
            'tanggal_bast' => $validated['tanggal_bast'],
            'nama_klient' => $validated['nama_klient'],
            'tanggal_tanda_tangan' => $validated['tanggal_tanda_tangan'],
            'hasil' => $validated['hasil'],
            'items' => $validated['items'],
        ];

        return $this->generatePDFResponse($data);
    }

    /**
     * Regenerate PDF dari history
     */
    public function regeneratePDF($id)
    {
        $document = BastDocument::findOrFail($id);
        
        $data = [
            'nomor_surat' => $document->nomor_surat,
            'nama_hari' => $document->nama_hari,
            'tanggal_bast' => $document->tanggal_bast,
            'nama_klient' => $document->nama_klient,
            'tanggal_tanda_tangan' => $document->tanggal_tanda_tangan,
            'hasil' => $document->hasil ?? 'BAIK',
            'items' => $document->items,
        ];

        return $this->generatePDFResponse($data);
    }

    /**
     * Helper untuk generate PDF response
     */
    private function generatePDFResponse($data)
    {
        // Setup Dompdf
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        
        $dompdf = new Dompdf($options);
        
        // Render view
        $html = view('pdf.bast', $data)->render();
        
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
        
        $filename = 'BAST-' . $data['nomor_surat'] . '.pdf';
        
        return response()->make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
    }

    /**
     * Delete BAST document
     */
    public function destroy($id)
    {
        try {
            $document = BastDocument::findOrFail($id);
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
