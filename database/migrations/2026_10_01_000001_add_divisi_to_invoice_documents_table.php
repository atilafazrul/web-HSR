<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_documents', function (Blueprint $table) {
            if (!Schema::hasColumn('invoice_documents', 'divisi')) {
                $table->string('divisi', 50)->nullable()->after('projek_kerja_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('invoice_documents', function (Blueprint $table) {
            if (Schema::hasColumn('invoice_documents', 'divisi')) {
                $table->dropColumn('divisi');
            }
        });
    }
};
