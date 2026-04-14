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
        if (Schema::hasTable('projek_kerja_photos')) {
            return;
        }

        Schema::create('projek_kerja_photos', function (Blueprint $table) {
            $table->id();

            // relasi ke projek_kerjas
            $table->unsignedBigInteger('projek_kerja_id');

            // path foto
            $table->string('photo');

            $table->timestamps();

            /* ================= FOREIGN KEY ================= */

            $table->foreign('projek_kerja_id')
                ->references('id')
                ->on('projek_kerjas')
                ->onDelete('cascade');

            /* ================= INDEX ================= */

            $table->index('projek_kerja_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projek_kerja_photos');
    }
};
