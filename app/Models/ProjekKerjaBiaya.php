<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjekKerjaBiaya extends Model
{
    protected $table = 'projek_kerja_biayas';

    protected $fillable = [
        'projek_kerja_id',
        'kategori',
        'nominal',
        'keterangan',
        'oleh',
        'is_lunas',
        'lunas_at',
        'lunas_group_id',
        'item_created_at',
        'sort_order',
    ];

    // Foto (bukti pengeluaran/reimbursment) selalu ikut dimuat agar accessor
    // photo_paths di bawah tidak memicu query N+1.
    protected $with = ['photos'];

    protected function casts(): array
    {
        return [
            'nominal' => 'decimal:2',
            'is_lunas' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function projekKerja(): BelongsTo
    {
        return $this->belongsTo(ProjekKerja::class, 'projek_kerja_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ProjekKerjaBiayaPhoto::class, 'projek_kerja_biaya_id')->orderBy('sort_order');
    }

    /**
     * Backward-compat: kode lama (controller & PDF/export) memperlakukan
     * `photo_paths` sebagai array string path, bukan relasi.
     */
    public function getPhotoPathsAttribute(): array
    {
        return $this->photos->pluck('path')->values()->all();
    }

    /**
     * Setter untuk kompatibilitas jika ada kode yang meng-assign langsung
     * (mis. `$biaya->photo_paths = [...]`). Mengganti seluruh foto baris ini.
     */
    public function setPhotoPathsAttribute($paths): void
    {
        $clean = is_array($paths)
            ? array_values(array_filter($paths, fn ($p) => is_string($p) && $p !== ''))
            : [];

        if (!$this->exists || !$this->getKey()) {
            return;
        }

        $this->photos()->delete();

        $rows = [];
        foreach ($clean as $index => $path) {
            $rows[] = ['path' => $path, 'sort_order' => $index];
        }
        if ($rows !== []) {
            $this->photos()->createMany($rows);
        }

        $this->unsetRelation('photos');
    }
}
