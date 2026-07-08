<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SphDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_surat',
        'lampiran',
        'perihal',
        'penerima_nama',
        'paragraf_pembuka',
        'items',
        'total_harga',
        'kota_tanda_tangan',
        'tanggal_tanda_tangan',
        'nama_penandatangan',
        'jabatan_penandatangan',
        'syarat_ketentuan',
        'paragraf_penutup',
        'nomor_urut',
        'bulan',
        'tahun',
    ];

    protected $casts = [
        'items' => 'array',
        'total_harga' => 'integer',
    ];
}
