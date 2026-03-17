<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BastDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_surat',
        'nama_hari',
        'tanggal_bast',
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
