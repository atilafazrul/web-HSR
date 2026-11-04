<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'projek_kerja_id',
        'divisi',
        'nomor_surat',
        'tanggal_invoice',
        'tanggal_jatuh_tempo',
        'no_po',
        'pakai_ttd',
        'pakai_cap',
        'bill_to_nama',
        'bill_to_alamat',
        'bill_to_telepon',
        'items',
        'subtotal',
        'diskon_persen',
        'diskon_nominal',
        'ppn_persen',
        'ppn_nominal',
        'total_harga',
        'tipe_pembayaran',
        'dp_persen',
        'dp_nominal',
        'sisa_pembayaran',
        'catatan',
        'terms',
        'nama_penandatangan',
        'jabatan_penandatangan',
        'nomor_urut',
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
        'tipe_pembayaran' => 'string',
        'dp_persen' => 'float',
        'dp_nominal' => 'integer',
        'sisa_pembayaran' => 'integer',
        'pakai_ttd'   => 'boolean',
        'pakai_cap'   => 'boolean',
    ];
}
