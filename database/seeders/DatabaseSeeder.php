<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
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
        */

        // Super Admin
        User::updateOrCreate(
            ['email' => 'super@admin.com'],
            [
                'name' => 'Super Admin',
                'phone' => null,
                'address' => null,
                'profile_photo' => null,
                'password' => Hash::make('123456'),
                'role' => 'super_admin',
                'divisi' => null,
            ]
        );

        // Admin Utama
        User::updateOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'Admin',
                'phone' => null,
                'address' => null,
                'profile_photo' => null,
                'password' => Hash::make('123456'),
                'role' => 'admin',
                'divisi' => null,
            ]
        );

        // Admin Service
        User::updateOrCreate(
            ['email' => 'atila@admin.com'],
            [
                'name' => 'ATILA',
                'phone' => null,
                'address' => null,
                'profile_photo' => null,
                'password' => Hash::make('123456'),
                'role' => 'admin',
                'divisi' => 'Service',
            ]
        );

        // Admin IT
        User::updateOrCreate(
            ['email' => 'aqila@admin.com'],
            [
                'name' => 'Aqila',
                'phone' => null,
                'address' => null,
                'profile_photo' => null,
                'password' => Hash::make('123456'),
                'role' => 'admin',
                'divisi' => 'IT',
            ]
        );

        // Admin Sales
        User::updateOrCreate(
            ['email' => 'yuda@sales.com'],
            [
                'name' => 'Yuda',
                'phone' => null,
                'address' => null,
                'profile_photo' => null,
                'password' => Hash::make('123456'),
                'role' => 'admin',
                'divisi' => 'Sales',
            ]
        );

        // Admin Kontraktor
        User::updateOrCreate(
            ['email' => 'daffa@kontraktor.com'],
            [
                'name' => 'Daffa',
                'phone' => null,
                'address' => null,
                'profile_photo' => null,
                'password' => Hash::make('123456'),
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
            'status' => 'Proses',
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
            'status' => 'Terlambat',
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