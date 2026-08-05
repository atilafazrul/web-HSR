<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkChecklistStructure extends Model
{
    protected $fillable = [
        'type',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }
}
