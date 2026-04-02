<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('logistik_inventories', function (Blueprint $table) {
            // Store multiple photo paths (max 6 enforced at validation layer)
            $table->json('fotos')->nullable()->after('foto');
        });
    }

    public function down(): void
    {
        Schema::table('logistik_inventories', function (Blueprint $table) {
            $table->dropColumn('fotos');
        });
    }
};

