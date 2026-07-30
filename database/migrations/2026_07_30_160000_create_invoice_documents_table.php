<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_documents', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_surat')->unique();
            $table->string('tanggal_invoice');
            $table->string('tanggal_jatuh_tempo')->nullable();
            $table->string('bill_to_nama');
            $table->text('bill_to_alamat')->nullable();
            $table->string('bill_to_telepon')->nullable();
            $table->json('items');
            $table->unsignedBigInteger('subtotal')->default(0);
            $table->unsignedBigInteger('total_harga')->default(0);
            $table->text('catatan')->nullable();
            $table->text('terms')->nullable();
            $table->string('nama_penandatangan')->nullable();
            $table->string('jabatan_penandatangan')->nullable();
            $table->integer('nomor_urut');
            $table->integer('tahun');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_documents');
    }
};
