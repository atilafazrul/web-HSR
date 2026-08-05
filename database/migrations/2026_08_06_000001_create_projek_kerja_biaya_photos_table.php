<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pisahkan foto biaya (pengeluaran/reimbursment) dari kolom JSON `photo_paths`
     * di `projek_kerja_biayas` menjadi tabel relasional tersendiri, satu baris per foto.
     */
    public function up(): void
    {
        Schema::create('projek_kerja_biaya_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('projek_kerja_biaya_id')->constrained('projek_kerja_biayas')->cascadeOnDelete();
            $table->string('path');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('projek_kerja_biaya_id');
        });

        $hasJsonColumn = Schema::hasColumn('projek_kerja_biayas', 'photo_paths');

        if ($hasJsonColumn) {
            $now = now();

            DB::table('projek_kerja_biayas')
                ->whereNotNull('photo_paths')
                ->orderBy('id')
                ->select('id', 'photo_paths')
                ->chunkById(200, function ($rows) use ($now) {
                    $insertRows = [];

                    foreach ($rows as $row) {
                        $paths = json_decode((string) $row->photo_paths, true);
                        if (!is_array($paths)) {
                            continue;
                        }

                        foreach (array_values($paths) as $index => $path) {
                            if (!is_string($path) || $path === '') {
                                continue;
                            }

                            $insertRows[] = [
                                'projek_kerja_biaya_id' => $row->id,
                                'path' => $path,
                                'sort_order' => $index,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];
                        }
                    }

                    if ($insertRows !== []) {
                        DB::table('projek_kerja_biaya_photos')->insert($insertRows);
                    }
                });

            Schema::table('projek_kerja_biayas', function (Blueprint $table) {
                $table->dropColumn('photo_paths');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('projek_kerja_biayas', 'photo_paths')) {
            Schema::table('projek_kerja_biayas', function (Blueprint $table) {
                $table->json('photo_paths')->nullable();
            });

            $grouped = DB::table('projek_kerja_biaya_photos')
                ->orderBy('projek_kerja_biaya_id')
                ->orderBy('sort_order')
                ->get();

            $byBiaya = [];
            foreach ($grouped as $row) {
                $byBiaya[$row->projek_kerja_biaya_id][] = $row->path;
            }

            foreach ($byBiaya as $biayaId => $paths) {
                DB::table('projek_kerja_biayas')
                    ->where('id', $biayaId)
                    ->update(['photo_paths' => json_encode($paths)]);
            }
        }

        Schema::dropIfExists('projek_kerja_biaya_photos');
    }
};
