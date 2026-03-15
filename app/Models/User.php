<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    /**
     * Mass assignable attributes
     */
    protected $fillable = [

        // ================= BASIC =================
        'name',
        'email',
        'password',
        'role',
        'divisi',
        'profile_photo',

        // ================= DATA KTP =================
        'nik',
        'tempat_lahir',
        'tanggal_lahir',
        'alamat',
        'jenis_kelamin',
        'agama',
        'status_perkawinan',
        'pekerjaan',

        // ================= KONTAK =================
        'no_telepon',
        'golongan_darah',

        // ================= KONTAK DARURAT =================
        'kontak_darurat_nama',
        'kontak_darurat_hubungan',
        'kontak_darurat_telepon',
        'kontak_darurat_alamat',
    ];

    /**
     * Hidden attributes
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casting
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'tanggal_lahir' => 'date',
        'password' => 'hashed',
    ];

    /**
     * Append attribute supaya ikut muncul di API
     */
    protected $appends = ['phone'];

    /**
     * ================= ACCESSOR =================
     * Frontend baca -> phone
     */
    public function getPhoneAttribute()
    {
        return $this->no_telepon;
    }

    /**
     * ================= MUTATOR =================
     * Frontend kirim -> phone
     */
    public function setPhoneAttribute($value)
    {
        $this->attributes['no_telepon'] = $value;
    }
}