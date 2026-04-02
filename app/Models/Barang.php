<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barang extends Model
{
    use HasFactory;

    protected $table = 'barangs'; // opsional tapi aman

    protected $casts = [
        'fotos' => 'array',
    ];

    protected $fillable = [
    'kode_barang',
    'nama_barang',
    'merek',
    'model',
    'nomor_serial',
    'kategori',
    'stok',
    'keterangan', // WAJIB ADA
    'lokasi',
    'foto',
    'fotos',
    ];
}