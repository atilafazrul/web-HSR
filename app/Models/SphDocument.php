<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SphDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'projek_kerja_id',
        'nomor_surat',
        'lampiran',
        'perihal',
        'penerima_nama',
        'paragraf_pembuka',
        'items',
        'subtotal',
        'pakai_diskon',
        'diskon_persen',
        'diskon_nominal',
        'total_harga',
        'show_total',
        'pakai_ppn',
        'ppn_persen',
        'ppn_nominal',
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
        'subtotal' => 'integer',
        'pakai_diskon' => 'boolean',
        'diskon_persen' => 'float',
        'diskon_nominal' => 'integer',
        'total_harga' => 'integer',
        'show_total' => 'boolean',
        'pakai_ppn' => 'boolean',
        'ppn_persen' => 'float',
        'ppn_nominal' => 'integer',
    ];
}
