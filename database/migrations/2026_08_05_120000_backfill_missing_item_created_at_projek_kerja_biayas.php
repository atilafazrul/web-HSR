<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Baris lama tanpa `item_created_at` tidak bisa dicocokkan oleh logika
     * dedup di frontend (mergeBiayaCategoryForSave) maupun backend
     * (preserveMissingBiayaRowsByCreatedAt), sehingga selalu dianggap "baru"
     * dan tersalin ulang setiap kali form biaya project disimpan. Migrasi ini
     * mengisi nilai unik (per project + kategori) agar baris tersebut bisa
     * dikenali dan tidak terduplikasi lagi ke depannya.
     */
    public function up(): void
    {
        $rows = DB::table('projek_kerja_biayas')
            ->where(function ($q) {
                $q->whereNull('item_created_at')->orWhere('item_created_at', '');
            })
            ->orderBy('projek_kerja_id')
            ->orderBy('kategori')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get(['id', 'projek_kerja_id', 'kategori', 'created_at']);

        $offsetPerGroup = [];

        foreach ($rows as $row) {
            $groupKey = $row->projek_kerja_id . '|' . $row->kategori;
            $offsetPerGroup[$groupKey] = ($offsetPerGroup[$groupKey] ?? -1) + 1;
            $ms = $offsetPerGroup[$groupKey] % 1000;

            $base = $row->created_at ? strtotime($row->created_at) : time();
            $synthetic = date('Y-m-d\TH:i:s', $base) . sprintf('.%03dZ', $ms);

            DB::table('projek_kerja_biayas')
                ->where('id', $row->id)
                ->update(['item_created_at' => $synthetic]);
        }
    }

    public function down(): void
    {
        // Data-only backfill: baris yang aslinya kosong tidak bisa dibedakan lagi
        // dari baris yang memang sudah punya nilai, jadi tidak ada rollback yang aman.
    }
};
