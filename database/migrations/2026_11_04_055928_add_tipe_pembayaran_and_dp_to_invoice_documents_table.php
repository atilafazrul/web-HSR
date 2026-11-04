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
        Schema::table('invoice_documents', function (Blueprint $table) {
            $table->string('tipe_pembayaran', 20)->default('lunas')->after('total_harga');
            $table->decimal('dp_persen', 5, 2)->default(0)->after('tipe_pembayaran');
            $table->unsignedBigInteger('dp_nominal')->default(0)->after('dp_persen');
            $table->unsignedBigInteger('sisa_pembayaran')->default(0)->after('dp_nominal');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoice_documents', function (Blueprint $table) {
            $table->dropColumn(['tipe_pembayaran', 'dp_persen', 'dp_nominal', 'sisa_pembayaran']);
        });
    }
};
