<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProjekKerja extends Model
{
    use HasFactory;

    protected $table = 'projek_kerjas';


    /* =============================
       FIELD YANG BOLEH DISIMPAN
    ============================== */

    protected $fillable = [
        'report_no',
        'divisi',
        'created_by_divisi',
        'divisi_flow',
        'jenis_pekerjaan',
        'karyawan',
        'pic_karyawan',
        'karyawan_terlibat',
        'invited_user_ids',
        'alamat',
        'status',
        'status_history',
        'start_date',
        'problem_description',
        'barang_dibeli',
        'nominal_po',
        'nominal_po_items',
        'biaya_jalan_items',
        'biaya_pengeluaran_items',
        'biaya_reimbursment_items',
        'biaya_edit_meta',
        'is_lunas',
        'lunas_at',
        'is_archived',
        'archived_at',
        'archived_status',
    ];


    /* =============================
       AUTO CAST
    ============================== */

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'divisi_flow' => 'array',
        'karyawan_terlibat' => 'array',
        'invited_user_ids' => 'array',
        'biaya_edit_meta' => 'array',
        'status_history' => 'array',
        'nominal_po' => 'decimal:2',
        'is_lunas' => 'boolean',
        'lunas_at' => 'datetime',
        'is_archived' => 'boolean',
        'archived_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /* =============================
       APPEND COMPUTED ATTRIBUTES
       NOTE: biaya_*_items and nominal_po_items are no longer JSON columns.
       They are computed from `projek_kerja_biayas` / `projek_kerja_nominal_po_items`
       so existing controllers and the frontend keep the same API shape.
    ============================== */
    protected $appends = [
        'total_biaya',
        'profit',
        'nominal_po_items',
        'biaya_jalan_items',
        'biaya_pengeluaran_items',
        'biaya_reimbursment_items',
    ];


    /* =============================
       ACCESSOR: TOTAL BIAYA
       (Jumlah seluruh nominal biaya jalan + pengeluaran + reimbursment)
    ============================== */
    public function getTotalBiayaAttribute()
    {
        $sumItems = function ($items) {
            if (!is_array($items)) {
                return 0;
            }
            return collect($items)
                ->sum(fn ($it) => (float) ($it['nominal'] ?? 0));
        };

        return (float) (
            $sumItems($this->biaya_jalan_items)
            + $sumItems($this->biaya_pengeluaran_items)
            + $sumItems($this->biaya_reimbursment_items)
        );
    }


    /* =============================
       ACCESSOR: PROFIT
       (nominal_po - total_biaya)
    ============================== */
    public function getProfitAttribute()
    {
        return (float) (($this->nominal_po ?? 0) - $this->total_biaya);
    }

    /**
     * Baris Nominal PO dari tabel `projek_kerja_nominal_po_items`.
     * Bentuk API tetap [{ nominal, keterangan }] agar frontend tidak berubah.
     * Data lama (hanya kolom nominal_po) tetap tampil sebagai 1 baris.
     */
    public function getNominalPoItemsAttribute(): array
    {
        $rows = $this->relationLoaded('poItems')
            ? $this->poItems
            : $this->poItems()->orderBy('sort_order')->get();

        $normalized = $rows
            ->map(function (ProjekKerjaNominalPoItem $row) {
                return [
                    'id' => $row->id,
                    'nominal' => round((float) $row->nominal, 2),
                    'keterangan' => trim((string) ($row->keterangan ?? '')),
                ];
            })
            ->filter(fn ($row) => $row['nominal'] > 0 || $row['keterangan'] !== '')
            ->values()
            ->all();

        if ($normalized === []) {
            $legacy = round((float) ($this->attributes['nominal_po'] ?? 0), 2);
            if ($legacy > 0) {
                return [['id' => null, 'nominal' => $legacy, 'keterangan' => '']];
            }
        }

        return $normalized;
    }

    public function setNominalPoItemsAttribute($items): void
    {
        $this->syncNominalPoItems(is_array($items) ? $items : []);
    }


    /* =============================
       AUTO LOAD RELATION
    ============================== */

    protected $with = [
        'photos',
        'files',
        'poItems',
    ];

    protected $hidden = [
        'poItems',
        'po_items',
    ];


    /* =============================
       RELATION BIAYA (jalan/pengeluaran/reimbursment)
    ============================== */

    public function poItems()
    {
        return $this->hasMany(ProjekKerjaNominalPoItem::class, 'projek_kerja_id')->orderBy('sort_order');
    }

    protected function syncNominalPoItems(array $items): void
    {
        if (! $this->exists || ! $this->getKey()) {
            return;
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($items) {
            ProjekKerjaNominalPoItem::where('projek_kerja_id', $this->getKey())->delete();

            foreach (array_values($items) as $index => $item) {
                if (! is_array($item)) {
                    continue;
                }

                $nominal = round((float) ($item['nominal'] ?? 0), 2);
                $keterangan = trim((string) ($item['keterangan'] ?? ''));
                if ($nominal <= 0 && $keterangan === '') {
                    continue;
                }

                ProjekKerjaNominalPoItem::create([
                    'projek_kerja_id' => $this->getKey(),
                    'nominal' => $nominal,
                    'keterangan' => $keterangan,
                    'sort_order' => $index,
                ]);
            }
        });

        $this->unsetRelation('poItems');
    }

    public function upsertNominalPoItem(array $item): ProjekKerjaNominalPoItem
    {
        $nominal = round((float) ($item['nominal'] ?? 0), 2);
        $keterangan = trim((string) ($item['keterangan'] ?? ''));

        return \Illuminate\Support\Facades\DB::transaction(function () use ($item, $nominal, $keterangan) {
            $itemId = isset($item['id']) ? (int) $item['id'] : 0;

            if ($itemId > 0) {
                $row = ProjekKerjaNominalPoItem::query()
                    ->where('projek_kerja_id', $this->getKey())
                    ->where('id', $itemId)
                    ->lockForUpdate()
                    ->firstOrFail();
                $row->update([
                    'nominal' => $nominal,
                    'keterangan' => $keterangan,
                ]);
            } else {
                $maxSort = ProjekKerjaNominalPoItem::query()
                    ->where('projek_kerja_id', $this->getKey())
                    ->max('sort_order');
                $row = ProjekKerjaNominalPoItem::create([
                    'projek_kerja_id' => $this->getKey(),
                    'nominal' => $nominal,
                    'keterangan' => $keterangan,
                    'sort_order' => ((int) ($maxSort ?? -1)) + 1,
                ]);
            }

            $this->refreshNominalPoTotal();
            $this->unsetRelation('poItems');

            return $row->fresh();
        });
    }

    public function deleteNominalPoItem(int $itemId): void
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($itemId) {
            $row = ProjekKerjaNominalPoItem::query()
                ->where('projek_kerja_id', $this->getKey())
                ->where('id', $itemId)
                ->lockForUpdate()
                ->first();

            if ($row) {
                $row->delete();
            }

            $this->refreshNominalPoTotal();
            $this->unsetRelation('poItems');
        });
    }

    protected function refreshNominalPoTotal(): void
    {
        $sum = (float) ProjekKerjaNominalPoItem::query()
            ->where('projek_kerja_id', $this->getKey())
            ->sum('nominal');

        $this->forceFill(['nominal_po' => $sum])->save();
    }

    public function biayas()
    {
        return $this->hasMany(ProjekKerjaBiaya::class, 'projek_kerja_id')->with('photos')->orderBy('sort_order');
    }

    /**
     * Rebuild the legacy array shape (nominal/keterangan/is_lunas/oleh/created_at/...)
     * from the normalized `projek_kerja_biayas` rows for a given kategori.
     */
    protected function buildBiayaItemsArray(string $kategori): array
    {
        return $this->biayas
            ->where('kategori', $kategori)
            ->sortBy('sort_order')
            ->values()
            ->map(function (ProjekKerjaBiaya $row) {
                $item = [
                    'nominal' => (float) $row->nominal,
                    'keterangan' => (string) ($row->keterangan ?? ''),
                    'is_lunas' => (bool) $row->is_lunas,
                    'oleh' => (string) ($row->oleh ?? ''),
                ];

                if (!empty($row->item_created_at)) {
                    $item['created_at'] = $row->item_created_at;
                }
                if (!empty($row->photo_paths)) {
                    $item['photo_paths'] = $row->photo_paths;
                }
                if ($row->relationLoaded('photos') && $row->photos->isNotEmpty()) {
                    $item['photo_items'] = $row->photos->map(function ($photo) {
                        return [
                            'path' => $photo->path,
                            'uploaded_at' => $photo->created_at?->toIso8601String(),
                        ];
                    })->values()->all();
                }
                if (!empty($row->lunas_group_id)) {
                    $item['lunas_group_id'] = $row->lunas_group_id;
                }
                if (!empty($row->lunas_at)) {
                    $item['lunas_at'] = $row->lunas_at;
                }

                return $item;
            })
            ->all();
    }

    /**
     * Replace all rows of a kategori in `projek_kerja_biayas` with the given items,
     * preserving array order via `sort_order` (mirrors the old "overwrite whole
     * JSON array on save" behaviour used throughout the app).
     */
    protected function syncBiayaCategory(string $kategori, array $items): void
    {
        if (!$this->exists || !$this->getKey()) {
            return;
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($kategori, $items) {
            // Hapus dulu baris kategori ini; foto ikut terhapus lewat cascadeOnDelete
            // pada tabel projek_kerja_biaya_photos.
            ProjekKerjaBiaya::where('projek_kerja_id', $this->getKey())
                ->where('kategori', $kategori)
                ->delete();

            foreach (array_values($items) as $index => $item) {
                if (!is_array($item)) {
                    continue;
                }

                $biaya = ProjekKerjaBiaya::create([
                    'projek_kerja_id' => $this->getKey(),
                    'kategori' => $kategori,
                    'nominal' => round((float) ($item['nominal'] ?? 0), 2),
                    'keterangan' => (string) ($item['keterangan'] ?? ''),
                    'oleh' => (string) ($item['oleh'] ?? ''),
                    'is_lunas' => !empty($item['is_lunas']) ? 1 : 0,
                    'lunas_at' => $item['lunas_at'] ?? null,
                    'lunas_group_id' => $item['lunas_group_id'] ?? null,
                    'item_created_at' => $item['created_at'] ?? null,
                    'sort_order' => $index,
                ]);

                $photoPaths = isset($item['photo_paths']) && is_array($item['photo_paths'])
                    ? array_values(array_filter($item['photo_paths'], fn ($p) => is_string($p) && $p !== ''))
                    : [];

                if ($photoPaths !== []) {
                    $biaya->photos()->createMany(
                        array_map(
                            fn ($path, $pIndex) => ['path' => $path, 'sort_order' => $pIndex],
                            $photoPaths,
                            array_keys($photoPaths)
                        )
                    );
                }
            }
        });

        // Force the next read to hit the database again so getters reflect the change.
        $this->unsetRelation('biayas');
    }

    public function getBiayaJalanItemsAttribute()
    {
        return $this->buildBiayaItemsArray('jalan');
    }

    public function setBiayaJalanItemsAttribute($items): void
    {
        $this->syncBiayaCategory('jalan', is_array($items) ? $items : []);
    }

    public function getBiayaPengeluaranItemsAttribute()
    {
        return $this->buildBiayaItemsArray('pengeluaran');
    }

    public function setBiayaPengeluaranItemsAttribute($items): void
    {
        $this->syncBiayaCategory('pengeluaran', is_array($items) ? $items : []);
    }

    public function getBiayaReimbursmentItemsAttribute()
    {
        return $this->buildBiayaItemsArray('reimbursment');
    }

    public function setBiayaReimbursmentItemsAttribute($items): void
    {
        $this->syncBiayaCategory('reimbursment', is_array($items) ? $items : []);
    }


    /* =============================
       RELATION FOTO
    ============================== */

    public function photos()
    {
        return $this->hasMany(
            ProjekKerjaPhoto::class,
            'projek_kerja_id'
        );
    }


    /* =============================
       RELATION FILE
    ============================== */

    public function files()
    {
        return $this->hasMany(
            ProjekKerjaFile::class,
            'projek_kerja_id'
        );
    }


    /* =============================
       URL FOTO PERTAMA
    ============================== */

    public function getFirstPhotoUrlAttribute()
    {
        if ($this->photos && $this->photos->count() > 0) {
            return asset('storage/' . $this->photos->first()->photo);
        }

        return null;
    }
}