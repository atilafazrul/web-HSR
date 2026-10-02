<?php

namespace App\Console\Commands;

use App\Models\SppdDocument;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixSppdDuplicateNomorCommand extends Command
{
    protected $signature = 'sppd:fix-duplicate-nomor {--dry-run : Preview changes without applying them}';

    protected $description = 'Perbaiki nomor surat SPPD yang kembar/duplikat agar urut dan unik';

    private function bulanToRomawi(int $bulan): string
    {
        $romawi = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI',
            7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII',
        ];

        return $romawi[$bulan] ?? 'I';
    }

    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->warn('Menjalankan dalam mode DRY-RUN (tidak ada data yang diubah di database).');
        }

        $allDocs = SppdDocument::orderBy('id', 'asc')->get();

        if ($allDocs->isEmpty()) {
            $this->info('Tidak ada dokumen SPPD ditemukan.');
            return self::SUCCESS;
        }

        // Cari nomor_surat yang kembar
        $duplicates = DB::table('sppd_documents')
            ->select('nomor_surat')
            ->groupBy('nomor_surat')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('nomor_surat');

        if ($duplicates->isEmpty()) {
            $this->info('Semua nomor surat SPPD sudah unik, tidak ditemukan nomor yang kembar.');
            return self::SUCCESS;
        }

        $fixedList = [];

        foreach ($duplicates as $duplicateNomor) {
            $docs = SppdDocument::where('nomor_surat', $duplicateNomor)
                ->orderBy('id', 'asc')
                ->get();

            $isFirst = true;
            $currentUrut = (int) $docs->first()->nomor_urut;

            foreach ($docs as $doc) {
                if ($isFirst) {
                    $isFirst = false;
                    continue;
                }

                $tahun = (int) $doc->tahun;
                $bulan = (int) $doc->bulan;
                $bulanRomawi = $this->bulanToRomawi($bulan);

                // Lanjut ke nomor berikutnya secara berurutan
                do {
                    $currentUrut++;
                    $candidateNomor = sprintf('%03d/SPPD-HSR/%s/%d', $currentUrut, $bulanRomawi, $tahun);
                } while (SppdDocument::where('nomor_surat', $candidateNomor)->exists());

                $fixedList[] = [
                    'id' => $doc->id,
                    'nama_pegawai' => $doc->nama_pegawai,
                    'old_nomor' => $doc->nomor_surat,
                    'old_urut' => $doc->nomor_urut,
                    'new_nomor' => $candidateNomor,
                    'new_urut' => $currentUrut,
                    'doc' => $doc,
                ];
            }
        }

        $this->table(
            ['ID', 'Nama Pegawai', 'Nomor Lama', 'Urut Lama', 'Nomor Baru', 'Urut Baru'],
            array_map(fn($item) => [
                $item['id'],
                $item['nama_pegawai'],
                $item['old_nomor'],
                $item['old_urut'],
                $item['new_nomor'],
                $item['new_urut'],
            ], $fixedList)
        );

        if (!$isDryRun) {
            DB::transaction(function () use ($fixedList) {
                foreach ($fixedList as $item) {
                    $doc = $item['doc'];
                    $doc->nomor_urut = $item['new_urut'];
                    $doc->nomor_surat = $item['new_nomor'];
                    $doc->save();
                }
            });

            $this->info('Berhasil memperbaiki ' . count($fixedList) . ' dokumen SPPD yang kembar.');
        } else {
            $this->warn('Mode DRY-RUN selesai. Jalankan tanpa --dry-run untuk menerapkan perubahan.');
        }

        return self::SUCCESS;
    }
}
