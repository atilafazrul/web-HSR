<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scheduled_berita_acara_documents', function (Blueprint $table) {
            $table->string('recurrence_type', 20)->default('once')->after('scheduled_at');
            $table->timestamp('recurrence_end_at')->nullable()->after('recurrence_type');
            $table->unsignedInteger('run_count')->default(0)->after('recurrence_end_at');
        });
    }

    public function down(): void
    {
        Schema::table('scheduled_berita_acara_documents', function (Blueprint $table) {
            $table->dropColumn(['recurrence_type', 'recurrence_end_at', 'run_count']);
        });
    }
};
