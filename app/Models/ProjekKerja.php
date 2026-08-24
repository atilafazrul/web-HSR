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
       NOTE: biaya_*_items are no longer real JSON columns. They are
       computed on the fly from the `projek_kerja_biayas` table (see
       relation + accessors/mutators below) so existing controllers,
       services, and the frontend keep working against the same shape.
    ============================== */
    protected $appends = [
        'total_biaya',
        'profit',
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


    /* =============================
       AUTO LOAD RELATION
    ============================== */

    protected $with = [
        'photos',
        'files'
    ];


    /* =============================
       RELATION BIAYA (jalan/pengeluaran/reimbursment)
    ============================== */

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