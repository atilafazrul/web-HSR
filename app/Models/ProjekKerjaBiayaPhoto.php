<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjekKerjaBiayaPhoto extends Model
{
    protected $table = 'projek_kerja_biaya_photos';

    protected $fillable = [
        'projek_kerja_biaya_id',
        'path',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function biaya(): BelongsTo
    {
        return $this->belongsTo(ProjekKerjaBiaya::class, 'projek_kerja_biaya_id');
    }
}
