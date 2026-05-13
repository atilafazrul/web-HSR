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
        Schema::create('cuti_requests', function (Blueprint $table) {
            $table->id();

            // Pengaju cuti (admin / user / role lain)
            $table->unsignedBigInteger('user_id');

            // Snapshot data pengaju supaya tetap terbaca walau user dihapus
            $table->string('nama_pengaju')->nullable();
            $table->string('divisi_pengaju')->nullable();
            $table->string('role_pengaju')->nullable();

            // Detail cuti
            $table->enum('jenis_cuti', [
                'Cuti Tahunan',
                'Cuti Sakit',
                'Cuti Melahirkan',
                'Cuti Menikah',
                'Cuti Penting',
                'Cuti Lainnya',
            ])->default('Cuti Tahunan');

            $table->date('tanggal_mulai');
            $table->date('tanggal_selesai');
            $table->unsignedSmallInteger('jumlah_hari')->default(1);

            $table->text('alasan');
            $table->string('lampiran')->nullable(); // path file (PDF / gambar)

            // Approval flow
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->unsignedBigInteger('approved_by')->nullable(); // super admin id
            $table->string('approved_by_nama')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('alasan_penolakan')->nullable();

            $table->timestamps();

            // Index untuk performa query
            $table->index('user_id');
            $table->index('status');
            $table->index('tanggal_mulai');

            // Foreign key (gunakan SET NULL biar histori tetap ada)
            $table->foreign('user_id')
                ->references('id')->on('users')
                ->onDelete('cascade');

            $table->foreign('approved_by')
                ->references('id')->on('users')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cuti_requests');
    }
};
