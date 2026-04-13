<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DashboardBiaya extends Model
{
    use HasFactory;

    protected $fillable = [
        'divisi',
        'kategori',
        'nominal',
        'keterangan',
        'photo_paths',
        'is_lunas',
        'lunas_at',
        'created_by',
        'updated_by',
    ];

    protected $hidden = ['photo_paths'];

    protected $appends = ['photo_urls'];

    protected $casts = [
        'nominal' => 'decimal:2',
        'is_lunas' => 'boolean',
        'lunas_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'photo_paths' => 'array',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Root-relative URLs (same host as the app; avoids APP_URL localhost issues).
     *
     * @return array<int, string>
     */
    public function getPhotoUrlsAttribute(): array
    {
        $paths = $this->photo_paths;
        if (! is_array($paths) || $paths === []) {
            return [];
        }

        $urls = [];
        foreach ($paths as $p) {
            if (! $p) {
                continue;
            }
            $path = str_replace('\\', '/', (string) $p);
            $path = ltrim($path, '/');
            $urls[] = '/storage/'.$path;
        }

        return $urls;
    }
}
