<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PoDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_surat',
        'tanggal_po',
        'to_nama',
        'to_alamat',
        'ship_to_nama',
        'ship_to_alamat',
        'fob',
        'shipped_via',
        'payment_term',
        'items',
        'subtotal',
        'ppn_persen',
        'ppn_nominal',
        'total_harga',
        'kota_tanda_tangan',
        'nama_penandatangan',
        'jabatan_penandatangan',
        'nomor_urut',
        'bulan',
        'tahun',
    ];

    protected $casts = [
        'items' => 'array',
        'subtotal' => 'integer',
        'ppn_persen' => 'float',
        'ppn_nominal' => 'integer',
        'total_harga' => 'integer',
    ];
}
