<?php

namespace App\Http\Controllers\Concerns;

use App\Models\ProjekKerja;
use App\Models\ProjekKerjaFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

trait SavesDocumentToProjectFolder
{
    /**
     * Nama folder dokumentasi projek tempat semua PDF berita acara (BAM, BAST, BAUF,
     * SPPD, SPH, PO, Invoice) otomatis disimpan.
     */
    private const BERITA_ACARA_FOLDER = 'Berita_Acara';

    /**
     * Simpan salinan PDF berita acara ke folder "Berita Acara" pada Dokumentasi Projek,
     * supaya file yang dibuat dari halaman Berita Acara otomatis muncul juga di sana
     * tanpa perlu diunggah manual.
     */
    protected function saveDocumentPdfToProjectFolder(?int $projekKerjaId, string $pdfContents, string $filename): void
    {
        if (!$projekKerjaId) {
            return;
        }

        if (!ProjekKerja::query()->whereKey($projekKerjaId)->exists()) {
            return;
        }

        try {
            $targetDir = 'projek-kerja-files/' . $projekKerjaId . '/' . self::BERITA_ACARA_FOLDER;
            $candidate = $this->uniqueProjectFileName($targetDir, $filename);

            Storage::disk('public')->put($targetDir . '/' . $candidate, $pdfContents);

            ProjekKerjaFile::create([
                'projek_kerja_id' => $projekKerjaId,
                'file' => $targetDir . '/' . $candidate,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Gagal menyimpan PDF berita acara ke folder projek: ' . $e->getMessage());
        }
    }

    private function uniqueProjectFileName(string $targetDir, string $filename): string
    {
        $safeName = str_replace(['/', '\\'], '-', $filename);
        $safeName = preg_replace('/[^a-zA-Z0-9._ -]/', '', $safeName);
        $safeName = trim((string) $safeName);
        if ($safeName === '') {
            $safeName = 'dokumen.pdf';
        }

        $info = pathinfo($safeName);
        $base = (string) ($info['filename'] ?? 'dokumen');
        $ext = isset($info['extension']) && $info['extension'] !== '' ? '.' . $info['extension'] : '.pdf';

        $candidate = $base . $ext;
        $counter = 1;

        while (Storage::disk('public')->exists($targetDir . '/' . $candidate)) {
            $candidate = $base . ' (' . $counter . ')' . $ext;
            $counter++;
        }

        return $candidate;
    }
}
