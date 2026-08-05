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
        Schema::create('projek_kerja_biayas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('projek_kerja_id')->constrained('projek_kerjas')->cascadeOnDelete();
            $table->string('kategori', 20); // jalan | pengeluaran | reimbursment
            $table->decimal('nominal', 15, 2)->default(0);
            $table->text('keterangan')->nullable();
            $table->string('oleh')->nullable();
            $table->boolean('is_lunas')->default(false);
            $table->string('lunas_at')->nullable();
            $table->string('lunas_group_id', 64)->nullable();
            $table->json('photo_paths')->nullable();
            // Dedup/identity key used by the app to match rows across saves (was `created_at` inside the JSON item).
            $table->string('item_created_at')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['projek_kerja_id', 'kategori']);
            $table->index('lunas_group_id');
        });

        // Preserve existing biaya data that currently lives in the JSON columns
        // on projek_kerjas (biaya_jalan_items / biaya_pengeluaran_items / biaya_reimbursment_items).
        $categoryFields = [
            'jalan' => 'biaya_jalan_items',
            'pengeluaran' => 'biaya_pengeluaran_items',
            'reimbursment' => 'biaya_reimbursment_items',
        ];

        $hasJsonColumns = Schema::hasColumn('projek_kerjas', 'biaya_jalan_items');

        if ($hasJsonColumns) {
            $now = now();

            DB::table('projek_kerjas')->orderBy('id')->select(
                'id',
                'biaya_jalan_items',
                'biaya_pengeluaran_items',
                'biaya_reimbursment_items'
            )->chunk(100, function ($rows) use ($categoryFields, $now) {
                $insertRows = [];

                foreach ($rows as $row) {
                    foreach ($categoryFields as $kategori => $field) {
                        $items = json_decode((string) ($row->{$field} ?? ''), true);
                        if (!is_array($items)) {
                            continue;
                        }

                        foreach (array_values($items) as $index => $item) {
                            if (!is_array($item)) {
                                continue;
                            }

                            $insertRows[] = [
                                'projek_kerja_id' => $row->id,
                                'kategori' => $kategori,
                                'nominal' => round((float) ($item['nominal'] ?? 0), 2),
                                'keterangan' => (string) ($item['keterangan'] ?? ''),
                                'oleh' => (string) ($item['oleh'] ?? ''),
                                'is_lunas' => !empty($item['is_lunas']) ? 1 : 0,
                                'lunas_at' => $item['lunas_at'] ?? null,
                                'lunas_group_id' => $item['lunas_group_id'] ?? null,
                                'photo_paths' => isset($item['photo_paths']) && is_array($item['photo_paths'])
                                    ? json_encode(array_values($item['photo_paths']))
                                    : null,
                                'item_created_at' => $item['created_at'] ?? null,
                                'sort_order' => $index,
                                'created_at' => $now,
                                'updated_at' => $now,
                            ];
                        }
                    }
                }

                if ($insertRows !== []) {
                    DB::table('projek_kerja_biayas')->insert($insertRows);
                }
            });

            Schema::table('projek_kerjas', function (Blueprint $table) {
                $table->dropColumn([
                    'biaya_jalan_items',
                    'biaya_pengeluaran_items',
                    'biaya_reimbursment_items',
                ]);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasColumn('projek_kerjas', 'biaya_jalan_items')) {
            Schema::table('projek_kerjas', function (Blueprint $table) {
                $table->json('biaya_jalan_items')->nullable();
                $table->json('biaya_pengeluaran_items')->nullable();
                $table->json('biaya_reimbursment_items')->nullable();
            });

            $categoryFields = [
                'jalan' => 'biaya_jalan_items',
                'pengeluaran' => 'biaya_pengeluaran_items',
                'reimbursment' => 'biaya_reimbursment_items',
            ];

            $grouped = DB::table('projek_kerja_biayas')->orderBy('projek_kerja_id')->orderBy('sort_order')->get();
            $byProject = [];
            foreach ($grouped as $row) {
                $byProject[$row->projek_kerja_id][$row->kategori][] = [
                    'nominal' => (float) $row->nominal,
                    'keterangan' => $row->keterangan,
                    'oleh' => $row->oleh,
                    'is_lunas' => (bool) $row->is_lunas,
                    'lunas_at' => $row->lunas_at,
                    'lunas_group_id' => $row->lunas_group_id,
                    'photo_paths' => $row->photo_paths ? json_decode($row->photo_paths, true) : null,
                    'created_at' => $row->item_created_at,
                ];
            }

            foreach ($byProject as $projekId => $categories) {
                $update = [];
                foreach ($categoryFields as $kategori => $field) {
                    $update[$field] = json_encode($categories[$kategori] ?? []);
                }
                DB::table('projek_kerjas')->where('id', $projekId)->update($update);
            }
        }

        Schema::dropIfExists('projek_kerja_biayas');
    }
};
