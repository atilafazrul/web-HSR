<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'photo_paths',
        'item_created_at',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'nominal' => 'decimal:2',
            'is_lunas' => 'boolean',
            'photo_paths' => 'array',
            'sort_order' => 'integer',
        ];
    }

    public function projekKerja(): BelongsTo
    {
        return $this->belongsTo(ProjekKerja::class, 'projek_kerja_id');
    }
}
