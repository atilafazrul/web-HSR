<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BaufDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_surat',
        'nama_hari',
        'tanggal_bauf',
        'nama_klient',
        'tanggal_tanda_tangan',
        'hasil',
        'items',
        'nomor_urut',
        'bulan',
        'tahun',
    ];

    protected $casts = [
        'items' => 'array',
    ];
}
