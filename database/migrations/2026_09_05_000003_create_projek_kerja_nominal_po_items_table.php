<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projek_kerja_nominal_po_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('projek_kerja_id')->constrained('projek_kerjas')->cascadeOnDelete();
            $table->decimal('nominal', 18, 2)->default(0);
            $table->string('keterangan', 500)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['projek_kerja_id', 'sort_order']);
        });

        $hasJsonColumn = Schema::hasColumn('projek_kerjas', 'nominal_po_items');
        $now = now();

        DB::table('projek_kerjas')->orderBy('id')->select(
            array_values(array_filter([
                'id',
                'nominal_po',
                $hasJsonColumn ? 'nominal_po_items' : null,
            ]))
        )->chunk(100, function ($rows) use ($hasJsonColumn, $now) {
            $insertRows = [];

            foreach ($rows as $row) {
                $items = [];
                if ($hasJsonColumn) {
                    $items = $this->decodeItems($row->nominal_po_items ?? null);
                }

                if ($items === []) {
                    $legacy = round((float) ($row->nominal_po ?? 0), 2);
                    if ($legacy > 0) {
                        $items[] = ['nominal' => $legacy, 'keterangan' => ''];
                    }
                }

                foreach ($items as $index => $item) {
                    $insertRows[] = [
                        'projek_kerja_id' => $row->id,
                        'nominal' => $item['nominal'],
                        'keterangan' => $item['keterangan'],
                        'sort_order' => $index,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            if ($insertRows !== []) {
                DB::table('projek_kerja_nominal_po_items')->insert($insertRows);
            }
        });

        if ($hasJsonColumn) {
            Schema::table('projek_kerjas', function (Blueprint $table) {
                $table->dropColumn('nominal_po_items');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('projek_kerjas', 'nominal_po_items')) {
            Schema::table('projek_kerjas', function (Blueprint $table) {
                $table->json('nominal_po_items')->nullable()->after('nominal_po');
            });
        }

        $grouped = DB::table('projek_kerja_nominal_po_items')
            ->orderBy('projek_kerja_id')
            ->orderBy('sort_order')
            ->get();

        $byProject = [];
        foreach ($grouped as $row) {
            $byProject[$row->projek_kerja_id][] = [
                'nominal' => (float) $row->nominal,
                'keterangan' => (string) ($row->keterangan ?? ''),
            ];
        }

        foreach ($byProject as $projekId => $items) {
            DB::table('projek_kerjas')->where('id', $projekId)->update([
                'nominal_po_items' => json_encode($items),
            ]);
        }

        Schema::dropIfExists('projek_kerja_nominal_po_items');
    }

    private function decodeItems(mixed $raw): array
    {
        if (is_array($raw)) {
            $decoded = $raw;
        } elseif (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
        } else {
            $decoded = [];
        }

        if (! is_array($decoded)) {
            return [];
        }

        $normalized = [];
        foreach ($decoded as $row) {
            if (! is_array($row)) {
                continue;
            }
            $nominal = round((float) ($row['nominal'] ?? 0), 2);
            $keterangan = trim((string) ($row['keterangan'] ?? ''));
            if ($nominal <= 0 && $keterangan === '') {
                continue;
            }
            $normalized[] = [
                'nominal' => $nominal,
                'keterangan' => $keterangan,
            ];
        }

        return $normalized;
    }
};
