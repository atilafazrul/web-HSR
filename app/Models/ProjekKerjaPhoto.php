<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;

class ProjekKerjaPhoto extends Model
{
    use HasFactory;


    /* =============================
       NAMA TABEL (OPTIONAL)
    ============================== */
    protected $table = 'projek_kerja_photos';


    /* =============================
       FIELD YANG BOLEH DISIMPAN
    ============================== */
    protected $fillable = [
        'projek_kerja_id',
        'photo',
    ];


    /* =============================
       AUTO CAST
    ============================== */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['url'];


    /* =============================
       RELATION KE PROJECT
    ============================== */
    public function projekKerja()
    {
        return $this->belongsTo(ProjekKerja::class, 'projek_kerja_id');
    }


    /* =============================
       AUTO DELETE FILE
       JIKA DATA DIHAPUS
    ============================== */
    protected static function booted()
    {
        static::deleting(function ($photo) {

            if ($photo->photo && Storage::disk('public')->exists($photo->photo)) {
                Storage::disk('public')->delete($photo->photo);
            }

        });
    }


    /* =============================
       URL FOTO SIAP PAKAI
    ============================== */
    public function getUrlAttribute()
    {
        if ($this->photo) {
            $encodedPath = implode('/', array_map('rawurlencode', explode('/', $this->photo)));
            return asset('storage/' . $encodedPath);
        }

        return null;
    }
}