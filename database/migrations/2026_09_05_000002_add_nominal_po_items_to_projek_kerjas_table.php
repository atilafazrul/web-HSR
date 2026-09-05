<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('projek_kerjas', 'nominal_po_items')) {
            Schema::table('projek_kerjas', function (Blueprint $table) {
                $table->json('nominal_po_items')->nullable()->after('nominal_po');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('projek_kerjas', 'nominal_po_items')) {
            Schema::table('projek_kerjas', function (Blueprint $table) {
                $table->dropColumn('nominal_po_items');
            });
        }
    }
};
