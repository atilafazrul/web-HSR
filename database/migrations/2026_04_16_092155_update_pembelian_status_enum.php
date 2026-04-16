<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Ubah enum status dari ['Proses', 'Diterima'] ke ['Dipesan', 'Dikirim', 'Diterima']
        DB::statement("ALTER TABLE pembelians MODIFY COLUMN status ENUM('Dipesan', 'Dikirim', 'Diterima') NOT NULL DEFAULT 'Dipesan'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Kembalikan enum status ke ['Proses', 'Diterima']
        DB::statement("ALTER TABLE pembelians MODIFY COLUMN status ENUM('Proses', 'Diterima') NOT NULL DEFAULT 'Proses'");
    }
};
