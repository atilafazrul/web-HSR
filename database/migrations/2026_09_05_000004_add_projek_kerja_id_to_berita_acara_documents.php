<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach ($this->tables() as $tableName) {
            if (! Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'projek_kerja_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('projek_kerja_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('projek_kerjas')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables() as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'projek_kerja_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('projek_kerja_id');
            });
        }
    }

    private function tables(): array
    {
        return [
            'bam_documents',
            'bauf_documents',
            'bast_documents',
            'sppd_documents',
            'sph_documents',
            'po_documents',
            'invoice_documents',
            'service_reports',
        ];
    }
};
