<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('service_reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_no')->unique();

            // Customer Information
            $table->string('customer');
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();

            // Equipment Information
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_no')->nullable();
            $table->text('description')->nullable();
            $table->date('start_date')->nullable();
            $table->date('completed_date')->nullable();

            // Service Details
            $table->text('problem_description')->nullable();
            $table->text('service_performed')->nullable();
            $table->text('recommendation')->nullable();

            // Administration
            $table->string('nama_teknisi');
            $table->string('nama_client')->nullable();
            $table->string('kota')->nullable();
            $table->date('tanggal');

            // Division & Status
            $table->string('divisi')->default('SERVICE');
            $table->string('status')->default('Selesai');

            // User who created
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('service_reports');
    }
};
