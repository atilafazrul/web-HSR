<?php

namespace App\Services\BeritaAcara;

use App\Models\BamDocument;
use App\Models\BastDocument;
use App\Models\BaufDocument;
use App\Models\SppdDocument;
use Carbon\Carbon;

class BeritaAcaraNomorGenerator
{
    public static function bulanToRomawi(int $bulan): string
    {
        $romawi = [
            1 => 'I', 2 => 'II', 3 => 'III', 4 => 'IV', 5 => 'V', 6 => 'VI',
            7 => 'VII', 8 => 'VIII', 9 => 'IX', 10 => 'X', 11 => 'XI', 12 => 'XII',
        ];

        return $romawi[$bulan] ?? 'I';
    }

    public static function forBast(): array
    {
        return self::generate(BastDocument::class, 'BAST-HSR');
    }

    public static function forBauf(): array
    {
        return self::generate(BaufDocument::class, 'BAUF-HSR');
    }

    public static function forBam(): array
    {
        return self::generate(BamDocument::class, 'BAM-HSR');
    }

    public static function forSppd(): array
    {
        return self::generate(SppdDocument::class, 'SPPD-HSR', 'nomor_urut');
    }

    private static function generate(string $modelClass, string $prefix, string $urutColumn = 'nomor_urut'): array
    {
        $now = Carbon::now();
        $tahun = $now->year;
        $bulan = $now->month;
        $bulanRomawi = self::bulanToRomawi($bulan);

        $lastDocument = $modelClass::where('tahun', $tahun)
            ->where('bulan', $bulan)
            ->orderBy($urutColumn, 'desc')
            ->first();

        $nomorUrut = $lastDocument ? ((int) $lastDocument->{$urutColumn}) + 1 : 1;
        $nomorSurat = sprintf('%03d/%s/%s/%d', $nomorUrut, $prefix, $bulanRomawi, $tahun);

        return [
            'nomor_surat' => $nomorSurat,
            'nomor_urut' => $nomorUrut,
            'bulan' => $bulan,
            'tahun' => $tahun,
            'bulan_romawi' => $bulanRomawi,
        ];
    }
}
