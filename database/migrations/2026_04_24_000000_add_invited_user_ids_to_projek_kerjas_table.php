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
        Schema::table('projek_kerjas', function (Blueprint $table) {
            $table->json('invited_user_ids')->nullable()->after('karyawan_terlibat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projek_kerjas', function (Blueprint $table) {
            $table->dropColumn('invited_user_ids');
        });
    }
};
