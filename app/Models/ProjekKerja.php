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
        'alamat',
        'status',
        'status_history',
        'start_date',
        'problem_description',
        'barang_dibeli',
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
        'biaya_jalan_items' => 'array',
        'biaya_pengeluaran_items' => 'array',
        'biaya_reimbursment_items' => 'array',
        'biaya_edit_meta' => 'array',
        'status_history' => 'array',
        'is_lunas' => 'boolean',
        'lunas_at' => 'datetime',
        'is_archived' => 'boolean',
        'archived_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];


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