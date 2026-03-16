<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pembelian extends Model
{
    protected $fillable = [
        'no_po',
        'nama_barang',
        'supplier',
        'tanggal',
        'harga',
        'status',
        'foto'
    ];
}
