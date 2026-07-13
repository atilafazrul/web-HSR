<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledBeritaAcaraDocument extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    public const TYPE_BAST = 'bast';
    public const TYPE_BAUF = 'bauf';
    public const TYPE_BAM = 'bam';
    public const TYPE_SPH = 'sph';
    public const TYPE_SPPD = 'sppd';
    public const TYPE_SERVICE_REPORT = 'service_report';

    protected $fillable = [
        'projek_kerja_id',
        'created_by',
        'document_type',
        'form_payload',
        'scheduled_at',
        'status',
        'nomor_surat',
        'generated_document_id',
        'error_message',
        'processed_at',
    ];

    protected $casts = [
        'form_payload' => 'array',
        'scheduled_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    public function projekKerja(): BelongsTo
    {
        return $this->belongsTo(ProjekKerja::class, 'projek_kerja_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeDue($query)
    {
        return $query
            ->where('status', self::STATUS_PENDING)
            ->where('scheduled_at', '<=', now());
    }
}
