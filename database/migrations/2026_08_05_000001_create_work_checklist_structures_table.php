<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('work_checklist_structures', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20)->unique();
            $table->json('payload');
            $table->timestamps();
        });

        // Preserve any structure data that was previously cached as flat JSON
        // files under storage/app/private/templates/checklist_{type}.json.
        foreach (['planning', 'realisasi'] as $type) {
            $jsonPath = storage_path("app/private/templates/checklist_{$type}.json");

            if (!file_exists($jsonPath)) {
                continue;
            }

            $decoded = json_decode((string) file_get_contents($jsonPath), true);

            if (!is_array($decoded)) {
                continue;
            }

            DB::table('work_checklist_structures')->updateOrInsert(
                ['type' => $type],
                [
                    'payload' => json_encode($decoded, JSON_UNESCAPED_UNICODE),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_checklist_structures');
    }
};
