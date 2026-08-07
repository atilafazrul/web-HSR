<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjekKerjaFile extends Model
{

    use HasFactory;

    protected $table = "projek_kerja_files";

    protected $fillable = [
        'projek_kerja_id',
        'file'
    ];

    protected $appends = ['url'];

    public function getUrlAttribute()
    {
        if ($this->file) {
            $encodedPath = implode('/', array_map('rawurlencode', explode('/', $this->file)));
            return asset('storage/' . $encodedPath);
        }
        return null;
    }


    /* =========================================
       RELASI KE PROJEK KERJA
    ========================================= */

    public function projekKerja()
    {
        return $this->belongsTo(ProjekKerja::class, 'projek_kerja_id');
    }

}