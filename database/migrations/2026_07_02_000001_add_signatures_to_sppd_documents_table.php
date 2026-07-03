<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sppd_documents', function (Blueprint $table) {
            $table->longText('ttd_dibuat_oleh')->nullable()->after('approve_jabatan');
            $table->longText('ttd_menyetujui')->nullable()->after('ttd_dibuat_oleh');
        });
    }

    public function down(): void
    {
        Schema::table('sppd_documents', function (Blueprint $table) {
            $table->dropColumn(['ttd_dibuat_oleh', 'ttd_menyetujui']);
        });
    }
};
