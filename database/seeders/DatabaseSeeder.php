<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;

use App\Models\ProjekKerja;
use App\Models\ProjekKerjaPhoto;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | USERS
        |--------------------------------------------------------------------------
        | Email & password diambil dari .env (SEED_*), bukan hardcoded, supaya
        | file ini aman untuk masuk git. Kalau env belum diisi, password akan
        | di-generate random (bukan default lama yang sudah pernah bocor).
        */

        // Super Admin
        User::updateOrCreate(
            ['email' => env('SEED_SUPERADMIN_EMAIL', 'super@admin.com')],
            [
                'name' => 'Super Admin',
                'phone' => null,
                'address' => null,
                'profile_photo' => null,
                'password' => Hash::make(env('SEED_SUPERADMIN_PASSWORD', Str::random(16))),
                'role' => 'super_admin',
                'divisi' => null,
            ]
        );

        // Admin Utama
        User::updateOrCreate(
            ['email' => env('SEED_ADMIN_EMAIL', 'admin@admin.com')],
            [
                'name' => 'Admin',
                'phone' => null,
                'address' => null,
                'profile_photo' => null,
                'password' => Hash::make(env('SEED_ADMIN_PASSWORD', Str::random(16))),
                'role' => 'admin',
                'divisi' => null,
            ]
        );

        // Admin Service
        User::updateOrCreate(
            ['email' => env('SEED_ATILA_EMAIL', 'atila@admin.com')],
            [
                'name' => 'ATILA',
                'phone' => null,
                'address' => null,
                'profile_photo' => null,
                'password' => Hash::make(env('SEED_ATILA_PASSWORD', Str::random(16))),
                'role' => 'admin',
                'divisi' => 'Service',
            ]
        );

        // Admin IT
        User::updateOrCreate(
            ['email' => env('SEED_AQILA_EMAIL', 'aqila@admin.com')],
            [
                'name' => 'Aqila',
                'phone' => null,
                'address' => null,
                'profile_photo' => null,
                'password' => Hash::make(env('SEED_AQILA_PASSWORD', Str::random(16))),
                'role' => 'admin',
                'divisi' => 'IT',
            ]
        );

        // Admin Sales
        User::updateOrCreate(
            ['email' => env('SEED_YUDA_EMAIL', 'yuda@sales.com')],
            [
                'name' => 'Yuda',
                'phone' => null,
                'address' => null,
                'profile_photo' => null,
                'password' => Hash::make(env('SEED_YUDA_PASSWORD', Str::random(16))),
                'role' => 'admin',
                'divisi' => 'Sales',
            ]
        );

        // Admin Kontraktor
        User::updateOrCreate(
            ['email' => env('SEED_DAFFA_EMAIL', 'daffa@kontraktor.com')],
            [
                'name' => 'Daffa',
                'phone' => null,
                'address' => null,
                'profile_photo' => null,
                'password' => Hash::make(env('SEED_DAFFA_PASSWORD', Str::random(16))),
                'role' => 'admin',
                'divisi' => 'Kontraktor',
            ]
        );


        /*
        |--------------------------------------------------------------------------
        | PROJEK KERJAS
        |--------------------------------------------------------------------------
        */

        $projek1 = ProjekKerja::create([
            'report_no' => 'SR001/HSR/23022026',
            'divisi' => 'IT',
            'jenis_pekerjaan' => 'benerin sepatu',
            'karyawan' => 'adi',
            'alamat' => 'jalan raya serang',
            'status' => 'Proses Pekerjaan',
            'start_date' => '2026-02-25',
            'problem_description' => '.....',
            'file' => 'projek-files/contoh1.pdf',
        ]);

        $projek2 = ProjekKerja::create([
            'report_no' => 'SR002/HSR/23022026',
            'divisi' => 'Sales',
            'jenis_pekerjaan' => 'benerin korek',
            'karyawan' => 'sopi',
            'alamat' => 'CITAYEM',
            'status' => 'Selesai',
            'start_date' => '2026-02-24',
            'problem_description' => 'sudah beres',
            'file' => 'projek-files/contoh2.pdf',
        ]);

        $projek3 = ProjekKerja::create([
            'report_no' => 'SR003/HSR/23022026',
            'divisi' => 'Kontraktor',
            'jenis_pekerjaan' => 'benerin mesin',
            'karyawan' => 'asuu',
            'alamat' => 'RSUD Tangerang',
            'status' => 'Persiapan',
            'start_date' => '2026-02-24',
            'problem_description' => 'banyak debu',
            'file' => null,
        ]);


        /*
        |--------------------------------------------------------------------------
        | FOTO PROJEK (MULTI FOTO)
        |--------------------------------------------------------------------------
        */

        ProjekKerjaPhoto::create([
            'projek_kerja_id' => $projek1->id,
            'photo' => 'projek-photos/foto1.jpg',
        ]);

        ProjekKerjaPhoto::create([
            'projek_kerja_id' => $projek1->id,
            'photo' => 'projek-photos/foto2.jpg',
        ]);

        ProjekKerjaPhoto::create([
            'projek_kerja_id' => $projek2->id,
            'photo' => 'projek-photos/foto3.jpg',
        ]);

        ProjekKerjaPhoto::create([
            'projek_kerja_id' => $projek3->id,
            'photo' => 'projek-photos/foto4.jpg',
        ]);
    }
}