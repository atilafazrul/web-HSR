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
        Schema::table('projek_kerjas', function (Blueprint $table) {
            if (!Schema::hasColumn('projek_kerjas', 'nominal_po')) {
                // Nominal Purchase Order dari customer (untuk perhitungan profit projek)
                $table->decimal('nominal_po', 18, 2)->default(0)->after('barang_dibeli');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projek_kerjas', function (Blueprint $table) {
            if (Schema::hasColumn('projek_kerjas', 'nominal_po')) {
                $table->dropColumn('nominal_po');
            }
        });
    }
};
