<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_reports', function (Blueprint $table) {
            $table->longText('ttd_teknisi')->nullable()->after('nama_client');
            $table->longText('ttd_klien')->nullable()->after('ttd_teknisi');
        });
    }

    public function down(): void
    {
        Schema::table('service_reports', function (Blueprint $table) {
            $table->dropColumn(['ttd_teknisi', 'ttd_klien']);
        });
    }
};
