<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogistikInventory extends Model
{
    protected $fillable = [
        'kode_barang',
        'nama_barang',
        'kategori',
        'stok',
        'lokasi',
        'foto'
    ];
}
