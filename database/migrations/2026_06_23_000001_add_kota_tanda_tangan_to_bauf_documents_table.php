<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bauf_documents', function (Blueprint $table) {
            $table->string('kota_tanda_tangan', 100)->default('Tangerang')->after('tanggal_tanda_tangan');
        });
    }

    public function down(): void
    {
        Schema::table('bauf_documents', function (Blueprint $table) {
            $table->dropColumn('kota_tanda_tangan');
        });
    }
};
