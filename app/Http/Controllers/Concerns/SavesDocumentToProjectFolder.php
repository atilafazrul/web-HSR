<?php

namespace App\Http\Controllers\Concerns;

use App\Models\ProjekKerja;
use App\Models\ProjekKerjaFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

trait SavesDocumentToProjectFolder
{
    /**
     * Simpan salinan PDF ke folder dokumentasi projek sesuai jenis dokumen
     * (BAM, SPH, BAST, dst.) supaya tidak tercampur di satu folder Berita_Acara.
     */
    protected function saveDocumentPdfToProjectFolder(
        ?int $projekKerjaId,
        string $pdfContents,
        string $filename,
        string $folderName = 'Berita_Acara'
    ): void {
        if (!$projekKerjaId) {
            return;
        }

        if (!ProjekKerja::query()->whereKey($projekKerjaId)->exists()) {
            return;
        }

        $folderName = $this->sanitizeProjectFolderName($folderName);

        try {
            $targetDir = 'projek-kerja-files/' . $projekKerjaId . '/' . $folderName;
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

    private function sanitizeProjectFolderName(string $folderName): string
    {
        $safe = preg_replace('/[^a-zA-Z0-9._ -]/', '', str_replace(['/', '\\'], '-', $folderName));
        $safe = trim((string) $safe);

        return $safe !== '' ? $safe : 'Berita_Acara';
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
