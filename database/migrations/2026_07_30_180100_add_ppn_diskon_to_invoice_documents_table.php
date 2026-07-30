<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_documents', function (Blueprint $table) {
            $table->decimal('diskon_persen', 5, 2)->default(0)->after('subtotal');
            $table->unsignedBigInteger('diskon_nominal')->default(0)->after('diskon_persen');
            $table->decimal('ppn_persen', 5, 2)->default(11)->after('diskon_nominal');
            $table->unsignedBigInteger('ppn_nominal')->default(0)->after('ppn_persen');
        });
    }

    public function down(): void
    {
        Schema::table('invoice_documents', function (Blueprint $table) {
            $table->dropColumn(['diskon_persen', 'diskon_nominal', 'ppn_persen', 'ppn_nominal']);
        });
    }
};
