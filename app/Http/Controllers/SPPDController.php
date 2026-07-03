<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Dompdf\Dompdf;
use Dompdf\Options;
use Carbon\Carbon;
use App\Models\SppdDocument;
use App\Services\SignatureStampMerger;

class SPPDController extends Controller
{
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

    private function generateNomorSurat()
    {
        $now = Carbon::now();
        $tahun = $now->year;
        $bulan = $now->month;
        $bulanRomawi = $this->bulanToRomawi($bulan);
        
        $lastDocument = SppdDocument::where('tahun', $tahun)
            ->where('bulan', $bulan)
            ->orderBy('nomor_urut', 'desc')
            ->first();
        
        $nomorUrut = $lastDocument ? $lastDocument->nomor_urut + 1 : 1;
        
        $nomorSurat = sprintf('%03d/SPPD-HSR/%s/%d', $nomorUrut, $bulanRomawi, $tahun);
        
        return [
            'nomor_surat' => $nomorSurat,
            'nomor_urut' => $nomorUrut,
            'bulan' => $bulan,
            'tahun' => $tahun,
            'bulan_romawi' => $bulanRomawi
        ];
    }

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

    public function getHistory()
    {
        $documents = SppdDocument::orderBy('created_at', 'desc')->get();
        
        return response()->json([
            'data' => $documents
        ]);
    }

    public function show($id)
    {
        $document = SppdDocument::findOrFail($id);
        
        return response()->json([
            'success' => true,
            'data' => $document
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pejabat_perintah' => 'required|string',
            'nama_pegawai' => 'required|string',
            'jabatan' => 'required|string',
            'tempat_berangkat' => 'required|string',
            'tempat_tujuan' => 'required|string',
            'transportasi' => 'required|string',
            'tanggal_berangkat' => 'required|string',
            'tanggal_kembali' => 'required|string',
            'maksud' => 'required|string',
            'pengikut_nama' => 'nullable|string',
            'atas_beban' => 'required|string',
            'keterangan' => 'nullable|string',
            'dibuat_oleh' => 'required|string',
            'tanggal_tanda_tangan' => 'required|string',
            'approve_nama' => 'required|string',
            'approve_jabatan' => 'nullable|string',
            'ttd_dibuat_oleh' => 'nullable|string|max:500000',
            'ttd_menyetujui' => 'nullable|string|max:500000',
        ]);

        $nomorData = $this->generateNomorSurat();

        $document = SppdDocument::create([
            'nomor_surat' => $nomorData['nomor_surat'],
            'nomor_urut' => $nomorData['nomor_urut'],
            'bulan' => $nomorData['bulan'],
            'tahun' => $nomorData['tahun'],
            'pejabat_perintah' => $validated['pejabat_perintah'],
            'nama_pegawai' => $validated['nama_pegawai'],
            'jabatan' => $validated['jabatan'],
            'tempat_berangkat' => $validated['tempat_berangkat'],
            'tempat_tujuan' => $validated['tempat_tujuan'],
            'transportasi' => $validated['transportasi'],
            'tanggal_berangkat' => $validated['tanggal_berangkat'],
            'tanggal_kembali' => $validated['tanggal_kembali'],
            'maksud' => $validated['maksud'],
            'pengikut_nama' => $validated['pengikut_nama'] ?? null,
            'atas_beban' => $validated['atas_beban'],
            'keterangan' => $validated['keterangan'] ?? null,
            'dibuat_oleh' => $validated['dibuat_oleh'],
            'tanggal_tanda_tangan' => $validated['tanggal_tanda_tangan'],
            'approve_nama' => $validated['approve_nama'],
            'approve_jabatan' => $validated['approve_jabatan'] ?? 'Direktur',
            'ttd_dibuat_oleh' => $validated['ttd_dibuat_oleh'] ?? null,
            'ttd_menyetujui' => $validated['ttd_menyetujui'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dokumen SPPD berhasil disimpan',
            'data' => $document
        ]);
    }

    public function generatePDF(Request $request)
    {
        $validated = $request->validate([
            'pejabat_perintah' => 'required|string',
            'nama_pegawai' => 'required|string',
            'jabatan' => 'required|string',
            'tempat_berangkat' => 'required|string',
            'tempat_tujuan' => 'required|string',
            'transportasi' => 'required|string',
            'tanggal_berangkat' => 'required|string',
            'tanggal_kembali' => 'required|string',
            'maksud' => 'required|string',
            'pengikut_nama' => 'nullable|string',
            'atas_beban' => 'required|string',
            'keterangan' => 'nullable|string',
            'dibuat_oleh' => 'required|string',
            'tanggal_tanda_tangan' => 'required|string',
            'approve_nama' => 'required|string',
            'approve_jabatan' => 'nullable|string',
            'ttd_dibuat_oleh' => 'nullable|string|max:500000',
            'ttd_menyetujui' => 'nullable|string|max:500000',
        ]);

        $nomorData = $this->generateNomorSurat();

        $document = SppdDocument::create([
            'nomor_surat' => $nomorData['nomor_surat'],
            'nomor_urut' => $nomorData['nomor_urut'],
            'bulan' => $nomorData['bulan'],
            'tahun' => $nomorData['tahun'],
            'pejabat_perintah' => $validated['pejabat_perintah'],
            'nama_pegawai' => $validated['nama_pegawai'],
            'jabatan' => $validated['jabatan'],
            'tempat_berangkat' => $validated['tempat_berangkat'],
            'tempat_tujuan' => $validated['tempat_tujuan'],
            'transportasi' => $validated['transportasi'],
            'tanggal_berangkat' => $validated['tanggal_berangkat'],
            'tanggal_kembali' => $validated['tanggal_kembali'],
            'maksud' => $validated['maksud'],
            'pengikut_nama' => $validated['pengikut_nama'] ?? null,
            'atas_beban' => $validated['atas_beban'],
            'keterangan' => $validated['keterangan'] ?? null,
            'dibuat_oleh' => $validated['dibuat_oleh'],
            'tanggal_tanda_tangan' => $validated['tanggal_tanda_tangan'],
            'approve_nama' => $validated['approve_nama'],
            'approve_jabatan' => $validated['approve_jabatan'] ?? 'Direktur',
            'ttd_dibuat_oleh' => $validated['ttd_dibuat_oleh'] ?? null,
            'ttd_menyetujui' => $validated['ttd_menyetujui'] ?? null,
        ]);

        $data = [
            'nomor_surat' => $nomorData['nomor_surat'],
            'pejabat_perintah' => $validated['pejabat_perintah'],
            'nama_pegawai' => $validated['nama_pegawai'],
            'jabatan' => $validated['jabatan'],
            'tempat_berangkat' => $validated['tempat_berangkat'],
            'tempat_tujuan' => $validated['tempat_tujuan'],
            'transportasi' => $validated['transportasi'],
            'tanggal_berangkat' => $validated['tanggal_berangkat'],
            'tanggal_kembali' => $validated['tanggal_kembali'],
            'maksud' => $validated['maksud'],
            'pengikut_nama' => $validated['pengikut_nama'] ?? null,
            'atas_beban' => $validated['atas_beban'],
            'keterangan' => $validated['keterangan'] ?? null,
            'dibuat_oleh' => $validated['dibuat_oleh'],
            'tanggal_tanda_tangan' => $validated['tanggal_tanda_tangan'],
            'approve_nama' => $validated['approve_nama'],
            'approve_jabatan' => $validated['approve_jabatan'] ?? 'Direktur',
            'ttd_dibuat_oleh' => $validated['ttd_dibuat_oleh'] ?? null,
            'ttd_menyetujui' => $validated['ttd_menyetujui'] ?? null,
        ];

        return $this->generatePDFResponse($data);
    }

    public function regeneratePDF($id)
    {
        $document = SppdDocument::findOrFail($id);
        
        $data = [
            'nomor_surat' => $document->nomor_surat,
            'pejabat_perintah' => $document->pejabat_perintah,
            'nama_pegawai' => $document->nama_pegawai,
            'jabatan' => $document->jabatan,
            'tempat_berangkat' => $document->tempat_berangkat,
            'tempat_tujuan' => $document->tempat_tujuan,
            'transportasi' => $document->transportasi,
            'tanggal_berangkat' => $document->tanggal_berangkat,
            'tanggal_kembali' => $document->tanggal_kembali,
            'maksud' => $document->maksud,
            'pengikut_nama' => $document->pengikut_nama,
            'atas_beban' => $document->atas_beban,
            'keterangan' => $document->keterangan,
            'dibuat_oleh' => $document->dibuat_oleh,
            'tanggal_tanda_tangan' => $document->tanggal_tanda_tangan,
            'approve_nama' => $document->approve_nama,
            'approve_jabatan' => $document->approve_jabatan ?? 'Direktur',
            'ttd_dibuat_oleh' => $document->ttd_dibuat_oleh,
            'ttd_menyetujui' => $document->ttd_menyetujui,
        ];

        return $this->generatePDFResponse($data);
    }

    public function destroy($id)
    {
        try {
            $document = SppdDocument::findOrFail($id);
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

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'pejabat_perintah' => 'required|string',
            'nama_pegawai' => 'required|string',
            'jabatan' => 'required|string',
            'tempat_berangkat' => 'required|string',
            'tempat_tujuan' => 'required|string',
            'transportasi' => 'required|string',
            'tanggal_berangkat' => 'required|string',
            'tanggal_kembali' => 'required|string',
            'maksud' => 'required|string',
            'pengikut_nama' => 'nullable|string',
            'atas_beban' => 'required|string',
            'keterangan' => 'nullable|string',
            'dibuat_oleh' => 'required|string',
            'tanggal_tanda_tangan' => 'required|string',
            'approve_nama' => 'required|string',
            'approve_jabatan' => 'nullable|string',
            'ttd_dibuat_oleh' => 'nullable|string|max:500000',
            'ttd_menyetujui' => 'nullable|string|max:500000',
        ]);

        $document = SppdDocument::findOrFail($id);
        
        $document->update([
            'pejabat_perintah' => $validated['pejabat_perintah'],
            'nama_pegawai' => $validated['nama_pegawai'],
            'jabatan' => $validated['jabatan'],
            'tempat_berangkat' => $validated['tempat_berangkat'],
            'tempat_tujuan' => $validated['tempat_tujuan'],
            'transportasi' => $validated['transportasi'],
            'tanggal_berangkat' => $validated['tanggal_berangkat'],
            'tanggal_kembali' => $validated['tanggal_kembali'],
            'maksud' => $validated['maksud'],
            'pengikut_nama' => $validated['pengikut_nama'] ?? null,
            'atas_beban' => $validated['atas_beban'],
            'keterangan' => $validated['keterangan'] ?? null,
            'dibuat_oleh' => $validated['dibuat_oleh'],
            'tanggal_tanda_tangan' => $validated['tanggal_tanda_tangan'],
            'approve_nama' => $validated['approve_nama'],
            'approve_jabatan' => $validated['approve_jabatan'] ?? 'Direktur',
            'ttd_dibuat_oleh' => $validated['ttd_dibuat_oleh'] ?? null,
            'ttd_menyetujui' => $validated['ttd_menyetujui'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Dokumen berhasil diperbarui',
            'data' => $document
        ]);
    }

    private function generatePDFResponse($data)
    {
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);

        $hsrLogoPath = public_path('images/hsr logo.png');
        $isoLogoPath = public_path('images/iso logo.png');
        $medimageLogoPath = public_path('images/medimage logo.png');
        $medhisLogoPath = public_path('images/medhis.png');
        $mediserLogoPath = public_path('images/mediser logo.png');
        $conexaLogoPath = public_path('images/conexa.png');
        $mksLogoPath = public_path('images/mks logo.png');
        $watermarkPath = public_path('images/LOGO HSR.png');
        $capStampPath = public_path('images/Cap HSR.png');

        $hsrLogoBase64 = '';
        $isoLogoBase64 = '';
        $medimageLogoBase64 = '';
        $medhisLogoBase64 = '';
        $mediserLogoBase64 = '';
        $conexaLogoBase64 = '';
        $mksLogoBase64 = '';
        $watermarkBase64 = '';
        $capStampBase64 = '';

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

        if (file_exists($capStampPath)) {
            $capStampData = base64_encode(file_get_contents($capStampPath));
            $capStampBase64 = 'data:image/png;base64,' . $capStampData;
        }

        if (!empty($capStampBase64)) {
            $merger = new SignatureStampMerger();
            $data['ttd_menyetujui'] = $merger->merge(
                $data['ttd_menyetujui'] ?? null,
                $capStampBase64
            );
        }

        if (!empty($data['ttd_dibuat_oleh'])) {
            $merger = $merger ?? new SignatureStampMerger();
            $data['ttd_dibuat_oleh'] = $merger->normalizeSignature($data['ttd_dibuat_oleh']);
        }

        $data['hsrLogo'] = $hsrLogoBase64;
        $data['isoLogo'] = $isoLogoBase64;
        $data['medimageLogo'] = $medimageLogoBase64;
        $data['medhisLogo'] = $medhisLogoBase64;
        $data['mediserLogo'] = $mediserLogoBase64;
        $data['conexaLogo'] = $conexaLogoBase64;
        $data['mksLogo'] = $mksLogoBase64;
        $data['watermark'] = $watermarkBase64;

        $html = view('pdf.sppd', $data)->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'SPPD-' . $data['nomor_surat'] . '.pdf';

        return response()->make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
    }
}