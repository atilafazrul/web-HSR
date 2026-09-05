<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PoDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'projek_kerja_id',
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
        'catatan',
        'subtotal',
        'diskon_persen',
        'diskon_nominal',
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
        'diskon_persen' => 'float',
        'diskon_nominal' => 'integer',
        'ppn_persen' => 'float',
        'ppn_nominal' => 'integer',
        'total_harga' => 'integer',
    ];
}
