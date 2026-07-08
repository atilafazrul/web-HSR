<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sph_documents', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_surat')->unique();
            $table->string('lampiran')->default('-');
            $table->string('perihal')->default('Penawaran Harga');
            $table->string('penerima_nama');
            $table->longText('paragraf_pembuka')->nullable();
            $table->json('items');
            $table->unsignedBigInteger('total_harga')->default(0);
            $table->string('kota_tanda_tangan')->default('Tangerang');
            $table->string('tanggal_tanda_tangan');
            $table->string('nama_penandatangan')->nullable();
            $table->string('jabatan_penandatangan')->default('Direktur');
            $table->longText('syarat_ketentuan')->nullable();
            $table->longText('paragraf_penutup')->nullable();
            $table->integer('nomor_urut');
            $table->integer('bulan');
            $table->integer('tahun');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sph_documents');
    }
};
