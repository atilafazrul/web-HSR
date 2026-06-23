<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bast_documents', function (Blueprint $table) {
            $table->longText('ttd_hsr')->nullable()->after('kota_tanda_tangan');
            $table->longText('ttd_klien')->nullable()->after('ttd_hsr');
        });

        Schema::table('bauf_documents', function (Blueprint $table) {
            $table->longText('ttd_hsr')->nullable()->after('kota_tanda_tangan');
            $table->longText('ttd_klien')->nullable()->after('ttd_hsr');
        });
    }

    public function down(): void
    {
        Schema::table('bast_documents', function (Blueprint $table) {
            $table->dropColumn(['ttd_hsr', 'ttd_klien']);
        });

        Schema::table('bauf_documents', function (Blueprint $table) {
            $table->dropColumn(['ttd_hsr', 'ttd_klien']);
        });
    }
};
