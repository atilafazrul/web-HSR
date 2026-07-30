<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('po_documents', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_surat')->unique();
            $table->string('tanggal_po');
            $table->string('to_nama');
            $table->text('to_alamat')->nullable();
            $table->string('ship_to_nama')->default('PT. HAYATI SEMESTA RAHARJA');
            $table->text('ship_to_alamat')->nullable();
            $table->string('fob')->nullable();
            $table->string('shipped_via')->nullable();
            $table->string('payment_term')->default('Cash On Delivery');
            $table->json('items');
            $table->unsignedBigInteger('subtotal')->default(0);
            $table->decimal('ppn_persen', 5, 2)->default(11);
            $table->unsignedBigInteger('ppn_nominal')->default(0);
            $table->unsignedBigInteger('total_harga')->default(0);
            $table->string('kota_tanda_tangan')->default('Tangerang');
            $table->string('nama_penandatangan')->nullable();
            $table->string('jabatan_penandatangan')->nullable();
            $table->integer('nomor_urut');
            $table->integer('bulan');
            $table->integer('tahun');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('po_documents');
    }
};
