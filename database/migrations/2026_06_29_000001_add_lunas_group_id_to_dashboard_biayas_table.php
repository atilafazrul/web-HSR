<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('dashboard_biayas', function (Blueprint $table) {
            $table->string('lunas_group_id', 64)->nullable()->after('lunas_at');
            $table->index('lunas_group_id');
        });
    }

    public function down(): void
    {
        Schema::table('dashboard_biayas', function (Blueprint $table) {
            $table->dropIndex(['lunas_group_id']);
            $table->dropColumn('lunas_group_id');
        });
    }
};
