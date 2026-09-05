<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjekKerjaNominalPoItem extends Model
{
    protected $table = 'projek_kerja_nominal_po_items';

    protected $fillable = [
        'projek_kerja_id',
        'nominal',
        'keterangan',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'nominal' => 'decimal:2',
            'sort_order' => 'integer',
        ];
    }

    public function projekKerja(): BelongsTo
    {
        return $this->belongsTo(ProjekKerja::class, 'projek_kerja_id');
    }
}
