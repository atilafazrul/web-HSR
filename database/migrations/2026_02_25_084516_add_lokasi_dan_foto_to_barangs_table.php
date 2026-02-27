<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barangs', function (Blueprint $table) {

            $table->string('lokasi')->nullable()->after('supplier');
            $table->string('foto')->nullable()->after('lokasi');

        });
    }

    public function down(): void
    {
        Schema::table('barangs', function (Blueprint $table) {

            $table->dropColumn('lokasi');
            $table->dropColumn('foto');

        });
    }
};