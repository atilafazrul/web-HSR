<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CutiRequest extends Model
{
    use HasFactory;

    protected $table = 'cuti_requests';

    protected $fillable = [
        'user_id',
        'nama_pengaju',
        'divisi_pengaju',
        'role_pengaju',
        'jenis_cuti',
        'tanggal_mulai',
        'tanggal_selesai',
        'jumlah_hari',
        'alasan',
        'lampiran',
        'status',
        'approved_by',
        'approved_by_nama',
        'approved_at',
        'alasan_penolakan',
    ];

    protected $casts = [
        'tanggal_mulai'   => 'date:Y-m-d',
        'tanggal_selesai' => 'date:Y-m-d',
        'approved_at'     => 'datetime',
        'jumlah_hari'     => 'integer',
    ];

    protected $appends = ['lampiran_url'];

    /* ============================================================
     * RELATIONSHIPS
     * ============================================================ */

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /* ============================================================
     * ACCESSOR – URL lampiran (untuk preview/download di frontend)
     * ============================================================ */
    public function getLampiranUrlAttribute()
    {
        if (!$this->lampiran) {
            return null;
        }

        return asset('storage/' . $this->lampiran);
    }
}
