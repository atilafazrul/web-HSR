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


    /* =========================================
       RELASI KE PROJEK KERJA
    ========================================= */

    public function projekKerja()
    {
        return $this->belongsTo(ProjekKerja::class, 'projek_kerja_id');
    }

}