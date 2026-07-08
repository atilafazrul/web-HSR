<?php

namespace App\Services\BeritaAcara;

use App\Models\BamDocument;
use App\Models\BastDocument;
use App\Models\BaufDocument;
use App\Models\ScheduledBeritaAcaraDocument;
use App\Models\SppdDocument;
use InvalidArgumentException;

class ScheduledBeritaAcaraGenerator
{
    public function generate(ScheduledBeritaAcaraDocument $schedule): array
    {
        $payload = $schedule->form_payload ?? [];

        return match ($schedule->document_type) {
            ScheduledBeritaAcaraDocument::TYPE_BAST => $this->generateBast($payload),
            ScheduledBeritaAcaraDocument::TYPE_BAUF => $this->generateBauf($payload),
            ScheduledBeritaAcaraDocument::TYPE_BAM => $this->generateBam($payload),
            ScheduledBeritaAcaraDocument::TYPE_SPPD => $this->generateSppd($payload),
            default => throw new InvalidArgumentException('Tipe dokumen tidak dikenal.'),
        };
    }

    private function generateBast(array $payload): array
    {
        $nomorData = BeritaAcaraNomorGenerator::forBast();

        $document = BastDocument::create([
            'nomor_surat' => $nomorData['nomor_surat'],
            'nama_hari' => $payload['nama_hari'],
            'tanggal_bast' => $payload['tanggal_bast'],
            'nama_klient' => $payload['nama_klient'],
            'tanggal_tanda_tangan' => $payload['tanggal_tanda_tangan'],
            'kota_tanda_tangan' => trim((string) ($payload['kota_tanda_tangan'] ?? '')) ?: 'Tangerang',
            'ttd_hsr' => $payload['ttd_hsr'] ?? null,
            'ttd_klien' => $payload['ttd_klien'] ?? null,
            'nama_ttd_hsr' => trim((string) ($payload['nama_ttd_hsr'] ?? '')) ?: null,
            'nama_ttd_klien' => trim((string) ($payload['nama_ttd_klien'] ?? '')) ?: null,
            'hasil' => $payload['hasil'] ?? 'BAIK',
            'items' => $payload['items'] ?? [],
            'nomor_urut' => $nomorData['nomor_urut'],
            'bulan' => $nomorData['bulan'],
            'tahun' => $nomorData['tahun'],
        ]);

        return [
            'document_id' => $document->id,
            'nomor_surat' => $document->nomor_surat,
        ];
    }

    private function generateBauf(array $payload): array
    {
        $nomorData = BeritaAcaraNomorGenerator::forBauf();

        $document = BaufDocument::create([
            'nomor_surat' => $nomorData['nomor_surat'],
            'nama_hari' => $payload['nama_hari'],
            'tanggal_bauf' => $payload['tanggal_bauf'],
            'nama_klient' => $payload['nama_klient'],
            'tanggal_tanda_tangan' => $payload['tanggal_tanda_tangan'],
            'kota_tanda_tangan' => trim((string) ($payload['kota_tanda_tangan'] ?? '')) ?: 'Tangerang',
            'ttd_hsr' => $payload['ttd_hsr'] ?? null,
            'ttd_klien' => $payload['ttd_klien'] ?? null,
            'nama_ttd_hsr' => trim((string) ($payload['nama_ttd_hsr'] ?? '')) ?: null,
            'nama_ttd_klien' => trim((string) ($payload['nama_ttd_klien'] ?? '')) ?: null,
            'hasil' => $payload['hasil'] ?? 'BAIK',
            'items' => $payload['items'] ?? [],
            'nomor_urut' => $nomorData['nomor_urut'],
            'bulan' => $nomorData['bulan'],
            'tahun' => $nomorData['tahun'],
        ]);

        return [
            'document_id' => $document->id,
            'nomor_surat' => $document->nomor_surat,
        ];
    }

    private function generateBam(array $payload): array
    {
        $nomorData = BeritaAcaraNomorGenerator::forBam();

        $document = BamDocument::create([
            'nomor_surat' => $nomorData['nomor_surat'],
            'nama_hari' => $payload['nama_hari'],
            'tanggal_bam' => $payload['tanggal_bam'],
            'nama_klient' => $payload['nama_klient'],
            'tanggal_tanda_tangan' => $payload['tanggal_tanda_tangan'],
            'ttd_hsr' => $payload['ttd_hsr'] ?? null,
            'ttd_klien' => $payload['ttd_klien'] ?? null,
            'nama_ttd_hsr' => trim((string) ($payload['nama_ttd_hsr'] ?? '')) ?: null,
            'nama_ttd_klien' => trim((string) ($payload['nama_ttd_klien'] ?? '')) ?: null,
            'hasil' => $payload['hasil'] ?? 'BAIK',
            'items' => $payload['items'] ?? [],
            'nomor_urut' => $nomorData['nomor_urut'],
            'bulan' => $nomorData['bulan'],
            'tahun' => $nomorData['tahun'],
        ]);

        return [
            'document_id' => $document->id,
            'nomor_surat' => $document->nomor_surat,
        ];
    }

    private function generateSppd(array $payload): array
    {
        $nomorData = BeritaAcaraNomorGenerator::forSppd();

        $document = SppdDocument::create([
            'nomor_surat' => $nomorData['nomor_surat'],
            'nomor_urut' => $nomorData['nomor_urut'],
            'bulan' => $nomorData['bulan'],
            'tahun' => $nomorData['tahun'],
            'pejabat_perintah' => $payload['pejabat_perintah'],
            'nama_pegawai' => $payload['nama_pegawai'],
            'jabatan' => $payload['jabatan'],
            'tempat_berangkat' => $payload['tempat_berangkat'],
            'tempat_tujuan' => $payload['tempat_tujuan'],
            'transportasi' => $payload['transportasi'],
            'tanggal_berangkat' => $payload['tanggal_berangkat'],
            'tanggal_kembali' => $payload['tanggal_kembali'],
            'maksud' => $payload['maksud'],
            'pengikut_nama' => $payload['pengikut_nama'] ?? null,
            'atas_beban' => $payload['atas_beban'],
            'keterangan' => $payload['keterangan'] ?? null,
            'dibuat_oleh' => $payload['dibuat_oleh'],
            'tanggal_tanda_tangan' => $payload['tanggal_tanda_tangan'],
            'approve_nama' => $payload['approve_nama'],
            'approve_jabatan' => $payload['approve_jabatan'] ?? 'Direktur',
            'ttd_dibuat_oleh' => $payload['ttd_dibuat_oleh'] ?? null,
            'ttd_menyetujui' => $payload['ttd_menyetujui'] ?? null,
        ]);

        return [
            'document_id' => $document->id,
            'nomor_surat' => $document->nomor_surat,
        ];
    }
}
