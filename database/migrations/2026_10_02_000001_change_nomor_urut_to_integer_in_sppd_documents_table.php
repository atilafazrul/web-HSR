<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ubah tipe kolom nomor_urut ke integer
        Schema::table('sppd_documents', function (Blueprint $table) {
            $table->integer('nomor_urut')->change();
        });

        // 2. Bersihkan duplicate nomor_surat yang sudah ada di database (misal di server) sebelum memasang constraint UNIQUE
        $duplicates = DB::table('sppd_documents')
            ->select('nomor_surat')
            ->groupBy('nomor_surat')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('nomor_surat');

        if ($duplicates->isNotEmpty()) {
            $romawi = [
                1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI',
                7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII',
            ];

            foreach ($duplicates as $duplicateNomor) {
                // Simpan baris pertama, ubah baris-baris berikutnya yang kembar
                $docs = DB::table('sppd_documents')
                    ->where('nomor_surat', $duplicateNomor)
                    ->orderBy('id', 'asc')
                    ->get();

                $isFirst = true;
                foreach ($docs as $doc) {
                    if ($isFirst) {
                        $isFirst = false;
                        continue;
                    }

                    $tahun = (int) $doc->tahun;
                    $bulan = (int) $doc->bulan;
                    $bulanRomawi = $romawi[$bulan] ?? 'I';

                    $maxUrut = DB::table('sppd_documents')
                        ->where('tahun', $tahun)
                        ->selectRaw('MAX(CAST(nomor_urut AS UNSIGNED)) as max_u')
                        ->value('max_u');

                    $nextUrut = $maxUrut ? ((int) $maxUrut + 1) : 1;

                    do {
                        $candidateNomor = sprintf('%03d/SPPD-HSR/%s/%d', $nextUrut, $bulanRomawi, $tahun);
                        $exists = DB::table('sppd_documents')->where('nomor_surat', $candidateNomor)->exists();
                        if ($exists) {
                            $nextUrut++;
                        } else {
                            break;
                        }
                    } while (true);

                    DB::table('sppd_documents')->where('id', $doc->id)->update([
                        'nomor_urut' => $nextUrut,
                        'nomor_surat' => $candidateNomor,
                    ]);
                }
            }
        }

        // 3. Pasang constraint UNIQUE pada nomor_surat di level database
        Schema::table('sppd_documents', function (Blueprint $table) {
            $table->unique('nomor_surat');
        });
    }

    public function down(): void
    {
        Schema::table('sppd_documents', function (Blueprint $table) {
            $table->dropUnique(['nomor_surat']);
            $table->string('nomor_urut')->change();
        });
    }
};
