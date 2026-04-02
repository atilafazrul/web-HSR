<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barangs', function (Blueprint $table) {
            $table->string('merek')->nullable()->after('nama_barang');
            $table->string('model')->nullable()->after('merek');
            $table->string('nomor_serial')->nullable()->after('model');
        });
    }

    public function down(): void
    {
        Schema::table('barangs', function (Blueprint $table) {
            $table->dropColumn(['merek', 'model', 'nomor_serial']);
        });
    }
};
