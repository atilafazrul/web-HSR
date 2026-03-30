<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'divisi',
        'profile_photo',
        'nik',
        'tempat_lahir',
        'tanggal_lahir',
        'alamat',
        'jenis_kelamin',
        'agama',
        'status_perkawinan',
        'pekerjaan',
        'no_telepon',
        'golongan_darah',
        'kontak_darurat_nama',
        'kontak_darurat_hubungan',
        'kontak_darurat_telepon',
        'kontak_darurat_alamat',
        'ktp',
        'kk',
        'akte',
        'ijazah',
        'sertifikat',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'tanggal_lahir' => 'date',
        'password' => 'hashed',
        'ijazah' => 'array',
        'sertifikat' => 'array',
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