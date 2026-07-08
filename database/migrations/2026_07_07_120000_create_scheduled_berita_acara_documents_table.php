<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scheduled_berita_acara_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('projek_kerja_id');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->string('document_type', 20);
            $table->json('form_payload');
            $table->timestamp('scheduled_at');
            $table->string('status', 20)->default('pending');
            $table->string('nomor_surat')->nullable();
            $table->unsignedBigInteger('generated_document_id')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->foreign('projek_kerja_id')
                ->references('id')
                ->on('projek_kerjas')
                ->cascadeOnDelete();
            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->index(['status', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scheduled_berita_acara_documents');
    }
};
