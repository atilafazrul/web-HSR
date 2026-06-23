<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bast_documents', function (Blueprint $table) {
            $table->string('nama_ttd_hsr', 150)->nullable()->after('ttd_klien');
            $table->string('nama_ttd_klien', 150)->nullable()->after('nama_ttd_hsr');
        });

        Schema::table('bauf_documents', function (Blueprint $table) {
            $table->string('nama_ttd_hsr', 150)->nullable()->after('ttd_klien');
            $table->string('nama_ttd_klien', 150)->nullable()->after('nama_ttd_hsr');
        });

        Schema::table('bam_documents', function (Blueprint $table) {
            $table->string('nama_ttd_hsr', 150)->nullable()->after('ttd_klien');
            $table->string('nama_ttd_klien', 150)->nullable()->after('nama_ttd_hsr');
        });
    }

    public function down(): void
    {
        Schema::table('bast_documents', function (Blueprint $table) {
            $table->dropColumn(['nama_ttd_hsr', 'nama_ttd_klien']);
        });

        Schema::table('bauf_documents', function (Blueprint $table) {
            $table->dropColumn(['nama_ttd_hsr', 'nama_ttd_klien']);
        });

        Schema::table('bam_documents', function (Blueprint $table) {
            $table->dropColumn(['nama_ttd_hsr', 'nama_ttd_klien']);
        });
    }
};
