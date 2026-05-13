<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ProjekKerja extends Model
{
    use HasFactory;

    protected $table = 'projek_kerjas';


    /* =============================
       FIELD YANG BOLEH DISIMPAN
    ============================== */

    protected $fillable = [
        'report_no',
        'divisi',
        'created_by_divisi',
        'divisi_flow',
        'jenis_pekerjaan',
        'karyawan',
        'pic_karyawan',
        'karyawan_terlibat',
        'invited_user_ids',
        'alamat',
        'status',
        'status_history',
        'start_date',
        'problem_description',
        'barang_dibeli',
        'nominal_po',
        'biaya_jalan_items',
        'biaya_pengeluaran_items',
        'biaya_reimbursment_items',
        'biaya_edit_meta',
        'is_lunas',
        'lunas_at',
        'is_archived',
        'archived_at',
        'archived_status',
    ];


    /* =============================
       AUTO CAST
    ============================== */

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'divisi_flow' => 'array',
        'karyawan_terlibat' => 'array',
        'invited_user_ids' => 'array',
        'biaya_jalan_items' => 'array',
        'biaya_pengeluaran_items' => 'array',
        'biaya_reimbursment_items' => 'array',
        'biaya_edit_meta' => 'array',
        'status_history' => 'array',
        'nominal_po' => 'decimal:2',
        'is_lunas' => 'boolean',
        'lunas_at' => 'datetime',
        'is_archived' => 'boolean',
        'archived_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /* =============================
       APPEND COMPUTED ATTRIBUTES
    ============================== */
    protected $appends = ['total_biaya', 'profit'];


    /* =============================
       ACCESSOR: TOTAL BIAYA
       (Jumlah seluruh nominal biaya jalan + pengeluaran + reimbursment)
    ============================== */
    public function getTotalBiayaAttribute()
    {
        $sumItems = function ($items) {
            if (!is_array($items)) {
                return 0;
            }
            return collect($items)
                ->sum(fn ($it) => (float) ($it['nominal'] ?? 0));
        };

        return (float) (
            $sumItems($this->biaya_jalan_items)
            + $sumItems($this->biaya_pengeluaran_items)
            + $sumItems($this->biaya_reimbursment_items)
        );
    }


    /* =============================
       ACCESSOR: PROFIT
       (nominal_po - total_biaya)
    ============================== */
    public function getProfitAttribute()
    {
        return (float) (($this->nominal_po ?? 0) - $this->total_biaya);
    }


    /* =============================
       AUTO LOAD RELATION
    ============================== */

    protected $with = [
        'photos',
        'files'
    ];


    /* =============================
       RELATION FOTO
    ============================== */

    public function photos()
    {
        return $this->hasMany(
            ProjekKerjaPhoto::class,
            'projek_kerja_id'
        );
    }


    /* =============================
       RELATION FILE
    ============================== */

    public function files()
    {
        return $this->hasMany(
            ProjekKerjaFile::class,
            'projek_kerja_id'
        );
    }


    /* =============================
       URL FOTO PERTAMA
    ============================== */

    public function getFirstPhotoUrlAttribute()
    {
        if ($this->photos && $this->photos->count() > 0) {
            return asset('storage/' . $this->photos->first()->photo);
        }

        return null;
    }
}