<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Divisi extends Model
{
    use HasFactory;

    protected $table = 'divisis';

    protected $fillable = [
        'name',
        'slug',
        'icon',
        'image',
        'description',
        'is_active',
        'modules',
        'order',
    ];

    protected $casts = [
        'modules' => 'array',
        'is_active' => 'boolean',
        'order' => 'integer',
    ];
}
