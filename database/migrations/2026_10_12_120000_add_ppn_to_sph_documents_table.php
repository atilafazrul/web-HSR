<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sph_documents', function (Blueprint $table) {
            $table->unsignedBigInteger('subtotal')->default(0)->after('items');
            $table->boolean('pakai_ppn')->default(false)->after('show_total');
            $table->decimal('ppn_persen', 5, 2)->default(11)->after('pakai_ppn');
            $table->unsignedBigInteger('ppn_nominal')->default(0)->after('ppn_persen');
        });

        DB::table('sph_documents')->update([
            'subtotal' => DB::raw('total_harga'),
            'pakai_ppn' => false,
            'ppn_nominal' => 0,
        ]);
    }

    public function down(): void
    {
        Schema::table('sph_documents', function (Blueprint $table) {
            $table->dropColumn(['subtotal', 'pakai_ppn', 'ppn_persen', 'ppn_nominal']);
        });
    }
};
