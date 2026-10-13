<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sph_documents', function (Blueprint $table) {
            $table->boolean('pakai_diskon')->default(false)->after('subtotal');
        });
    }

    public function down(): void
    {
        Schema::table('sph_documents', function (Blueprint $table) {
            $table->dropColumn('pakai_diskon');
        });
    }
};
