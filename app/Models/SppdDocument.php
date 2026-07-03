<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SppdDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'nomor_surat',
        'nomor_urut',
        'bulan',
        'tahun',
        'pejabat_perintah',
        'nama_pegawai',
        'jabatan',
        'tempat_berangkat',
        'tempat_tujuan',
        'transportasi',
        'tanggal_berangkat',
        'tanggal_kembali',
        'maksud',
        'pengikut_nama',
        'atas_beban',
        'keterangan',
        'dibuat_oleh',
        'tanggal_tanda_tangan',
        'approve_nama',
        'approve_jabatan',
        'ttd_dibuat_oleh',
        'ttd_menyetujui',
    ];
}