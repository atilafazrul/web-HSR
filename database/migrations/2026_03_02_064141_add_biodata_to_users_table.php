<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {

            // ================= DATA KTP =================
            $table->string('nik', 20)->nullable()->after('id');

            $table->string('tempat_lahir')->nullable();
            $table->date('tanggal_lahir')->nullable();

            $table->text('alamat')->nullable();

            $table->enum('jenis_kelamin', ['Laki-laki', 'Perempuan'])->nullable();

            $table->string('agama')->nullable();
            $table->string('status_perkawinan')->nullable();
            $table->string('pekerjaan')->nullable();

            $table->string('no_telepon', 20)->nullable();
            $table->enum('golongan_darah', ['A', 'B', 'AB', 'O'])->nullable();

            // ================= KONTAK DARURAT =================
            $table->string('kontak_darurat_nama')->nullable();
            $table->string('kontak_darurat_hubungan')->nullable();
            $table->string('kontak_darurat_telepon', 20)->nullable();
            $table->text('kontak_darurat_alamat')->nullable();

        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {

            $table->dropColumn([
                'nik',
                'tempat_lahir',
                'tanggal_lahir',
                'alamat',
                'jenis_kelamin',
                'agama',
                'status_perkawinan',
                'pekerjaan',
                'no_telepon',
                'golongan_darah',
                'kontak_darurat_nama',
                'kontak_darurat_hubungan',
                'kontak_darurat_telepon',
                'kontak_darurat_alamat'
            ]);

        });
    }
};