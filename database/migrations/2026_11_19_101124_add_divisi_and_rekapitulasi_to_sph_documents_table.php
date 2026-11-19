<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sph_documents', function (Blueprint $table) {
            $table->string('divisi', 50)->nullable()->after('projek_kerja_id');
            $table->boolean('pakai_rekapitulasi')->default(false)->after('paragraf_penutup');
            $table->string('rekapitulasi_judul')->nullable()->after('pakai_rekapitulasi');
            $table->json('rekapitulasi_data')->nullable()->after('rekapitulasi_judul');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sph_documents', function (Blueprint $table) {
            $table->dropColumn(['divisi', 'pakai_rekapitulasi', 'rekapitulasi_judul', 'rekapitulasi_data']);
        });
    }
};
