<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;

/* ================= MODEL ================= */
use App\Models\User;

/* ================= CONTROLLER ================= */
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProjekKerjaController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\FormPekerjaanController;
use App\Http\Controllers\BarangController;
use App\Http\Controllers\LogistikInventoryController;
use App\Http\Controllers\PembelianController;
use App\Http\Controllers\ServiceReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BASTController;
use App\Http\Controllers\BAUFController;
use App\Http\Controllers\BAMController;
use App\Http\Controllers\DashboardBiayaController;
use App\Http\Controllers\SPPDController;


/*
|--------------------------------------------------------------------------
| PUBLIC API ROUTES (No Authentication Required)
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login'])->name('login');


/*
|--------------------------------------------------------------------------
| DOWNLOAD ROUTES - WITHOUT auth:sanctum (use token from query parameter)
|--------------------------------------------------------------------------
| 🔥 KRUSIAL: Route download harus di OUTSIDE middleware auth:sanctum
| agar tidak redirect ke login saat preview file
*/

Route::get('/karyawan/{id}/ktp', [UserController::class, 'downloadKtp']);
Route::get('/karyawan/{id}/kk', [UserController::class, 'downloadKk']);
Route::get('/karyawan/{id}/akte', [UserController::class, 'downloadAkte']);
Route::get('/karyawan/{id}/ijazah', [UserController::class, 'downloadIjazah']);
Route::get('/karyawan/{id}/sertifikat', [UserController::class, 'downloadSertifikat']);


/*
|--------------------------------------------------------------------------
| PROTECTED API ROUTES (Authentication Required)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->group(function () {
    
    /*
    |--------------------------------------------------------------------------
    | AUTH API
    |--------------------------------------------------------------------------
    */
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);


    /*
    |--------------------------------------------------------------------------
    | PROFILE API
    |--------------------------------------------------------------------------
    */

    Route::get('/profile', function (Request $request) {

        $user = User::find($request->query('user_id'));

        if (!$user) {

            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);

        }

        return response()->json([
            'success' => true,
            'user' => $user
        ]);

    });


    Route::put('/profile', function (Request $request) {

        $validated = $request->validate([
            'user_id' => 'required|integer',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'no_telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string'
        ]);

        $user = User::find($validated['user_id']);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        // Siapkan data untuk update (hapus user_id dari array)
        $updateData = array_filter($validated, function($key) {
            return in_array($key, ['name', 'email', 'phone', 'no_telepon', 'alamat']);
        }, ARRAY_FILTER_USE_KEY);

        // Update user
        $user->update($updateData);
        
        // Ambil data terbaru
        $user->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Profile berhasil diupdate',
            'user' => $user
        ]);

    });


    Route::post('/profile/photo', function (Request $request) {

        $validated = $request->validate([
            'user_id' => 'required|integer',
            'photo' => 'required|image|max:2048'
        ]);

        $user = User::find($validated['user_id']);

        if (!$user) {

            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);

        }

        if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
            Storage::disk('public')->delete($user->profile_photo);
        }

        $path = $request->file('photo')->store('profile-photos', 'public');

        $user->profile_photo = $path;
        $user->save();

        return response()->json([
            'success' => true,
            'profile_photo' => $path
        ]);

    });


    Route::delete('/profile/photo', function (Request $request) {

        $user = User::find($request->user_id);

        if (!$user) {

            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);

        }

        if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
            Storage::disk('public')->delete($user->profile_photo);
        }

        $user->profile_photo = null;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Foto berhasil dihapus'
        ]);

    });


    /*
    |--------------------------------------------------------------------------
    | HRD - KARYAWAN
    |--------------------------------------------------------------------------
    */

    Route::get('/karyawan', [UserController::class, 'index']);
    Route::get('/karyawan/{id}', [UserController::class, 'show']);
    Route::post('/karyawan', [UserController::class, 'store']);
    Route::put('/karyawan/{id}', [UserController::class, 'update']);
    Route::delete('/karyawan/{id}', [UserController::class, 'destroy']);


    /*
    |--------------------------------------------------------------------------
    | DOKUMEN KARYAWAN - DELETE FILE (untuk multiple files)
    |--------------------------------------------------------------------------
    */

    // 🔥 DELETE FILE (untuk multiple files) - tetap di dalam auth:sanctum
    Route::post('/karyawan/{id}/delete-file', [UserController::class, 'deleteFile']);

    /*
    |--------------------------------------------------------------------------
    | NOTIFICATIONS
    |--------------------------------------------------------------------------
    */

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);


    /*
    |--------------------------------------------------------------------------
    | INVENTORY BARANG
    |--------------------------------------------------------------------------
    */

    Route::get('/barang', [BarangController::class, 'index']);
    Route::get('/barang/{id}', [BarangController::class, 'show']);
    Route::post('/barang', [BarangController::class, 'store']);

    Route::match(['put','patch'], '/barang/{id}', [
        BarangController::class,
        'update'
    ]);

    Route::delete('/barang/{id}', [
        BarangController::class,
        'destroy'
    ]);


    /*
    |--------------------------------------------------------------------------
    | INVENTORY LOGISTIK
    |--------------------------------------------------------------------------
    */

    Route::get('/logistik-inventory', [LogistikInventoryController::class, 'index']);
    Route::get('/logistik-inventory/{id}', [LogistikInventoryController::class, 'show']);
    Route::post('/logistik-inventory', [LogistikInventoryController::class, 'store']);

    Route::match(['put','patch'], '/logistik-inventory/{id}', [
        LogistikInventoryController::class,
        'update'
    ]);

    Route::delete('/logistik-inventory/{id}', [
        LogistikInventoryController::class,
        'destroy'
    ]);


    /*
    |--------------------------------------------------------------------------
    | PEMBELIAN PURCHASING
    |--------------------------------------------------------------------------
    */

    Route::get('/pembelian', [PembelianController::class, 'index']);
    Route::get('/pembelian/{id}', [PembelianController::class, 'show']);
    Route::post('/pembelian', [PembelianController::class, 'store']);

    Route::match(['put','patch'], '/pembelian/{id}', [
        PembelianController::class,
        'update'
    ]);

    Route::delete('/pembelian/{id}', [
        PembelianController::class,
        'destroy'
    ]);


    /*
    |--------------------------------------------------------------------------
    | BIAYA DASHBOARD (DI LUAR PROJEK)
    |--------------------------------------------------------------------------
    */
    Route::get('/dashboard-biaya', [DashboardBiayaController::class, 'index']);
    Route::get('/dashboard-biaya/summary', [DashboardBiayaController::class, 'summary']);
    Route::post('/dashboard-biaya', [DashboardBiayaController::class, 'store']);
    Route::patch('/dashboard-biaya/{id}', [DashboardBiayaController::class, 'update']);
    Route::delete('/dashboard-biaya/{id}', [DashboardBiayaController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | PROJEK KERJA
    |--------------------------------------------------------------------------
    */

    Route::get('/projek-kerja', [ProjekKerjaController::class, 'index']);

    Route::post('/projek-kerja', [ProjekKerjaController::class, 'store']);

    Route::patch('/projek-kerja/{id}/status', [
        ProjekKerjaController::class,
        'updateStatus'
    ]);

    Route::patch('/projek-kerja/{id}/deskripsi', [
        ProjekKerjaController::class,
        'updateDescription'
    ]);

    Route::patch('/projek-kerja/{id}/uang', [
        ProjekKerjaController::class,
        'updateUang'
    ]);
    Route::patch('/projek-kerja/{id}/lunas', [
        ProjekKerjaController::class,
        'setLunas'
    ]);
    Route::patch('/projek-kerja/{id}/archive', [
        ProjekKerjaController::class,
        'archive'
    ]);
    Route::patch('/projek-kerja/{id}/unarchive', [
        ProjekKerjaController::class,
        'unarchive'
    ]);

    Route::get('/projek-kerja/{id}/export-biaya', [
        ProjekKerjaController::class,
        'exportBiayaCsv',
    ]);

    // Tambahkan route untuk update data projek secara keseluruhan
    Route::put('/projek-kerja/{id}', [ProjekKerjaController::class, 'update']);


    /*
    |--------------------------------------------------------------------------
    | FOTO PROJEK
    |--------------------------------------------------------------------------
    */

    Route::get('/projek-kerja/{id}/photos', [
        ProjekKerjaController::class,
        'getPhotos'
    ]);

    Route::post('/projek-kerja/{id}/add-photo', [
        ProjekKerjaController::class,
        'addPhoto'
    ]);

    Route::delete('/projek-kerja/photo/{id}', [
        ProjekKerjaController::class,
        'deletePhoto'
    ]);


    /*
    |--------------------------------------------------------------------------
    | FILE / DOKUMEN PROJEK
    |--------------------------------------------------------------------------
    */

    Route::get('/projek-kerja/{id}/files', [
        ProjekKerjaController::class,
        'getFiles'
    ]);

    Route::post('/projek-kerja/{id}/add-file', [
        ProjekKerjaController::class,
        'addFile'
    ]);

    Route::delete('/projek-kerja/file/{id}', [
        ProjekKerjaController::class,
        'deleteFile'
    ]);


    /*
    |--------------------------------------------------------------------------
    | DETAIL PROJECT
    |--------------------------------------------------------------------------
    */

    Route::get('/projek-kerja/{id}', [
        ProjekKerjaController::class,
        'show'
    ]);


    /*
    |--------------------------------------------------------------------------
    | DELETE PROJECT
    |--------------------------------------------------------------------------
    */

    Route::delete('/projek-kerja/{id}', [
        ProjekKerjaController::class,
        'destroy'
    ]);


    /*
    |--------------------------------------------------------------------------
    | FORM → PDF
    |--------------------------------------------------------------------------
    */

    Route::post('/form-pekerjaan/pdf', [
        FormPekerjaanController::class,
        'generatePdf'
    ]);


    /*
    |--------------------------------------------------------------------------
    | SERVICE REPORT
    |--------------------------------------------------------------------------
    */

    Route::get('/service-reports', [ServiceReportController::class, 'index']);
    Route::get('/service-reports/{id}', [ServiceReportController::class, 'show']);

    Route::post('/service-reports', [ServiceReportController::class, 'store']);

    Route::put('/service-reports/{id}', [ServiceReportController::class, 'update']);

    Route::delete('/service-reports/{id}', [ServiceReportController::class, 'destroy']);

    Route::get('/service-reports/{id}/pdf', [
        ServiceReportController::class,
        'generatePDF'
    ]);


    /*
    |--------------------------------------------------------------------------
    | BAST PDF
    |--------------------------------------------------------------------------
    */

    Route::get('/bast/next-nomor', [
        BASTController::class,
        'getNextNomorSurat'
    ]);

    Route::get('/bast/history', [
        BASTController::class,
        'getHistory'
    ]);

    Route::post('/bast/pdf', [
        BASTController::class,
        'generatePDF'
    ]);

    Route::get('/bast/{id}/pdf', [
        BASTController::class,
        'regeneratePDF'
    ]);

    Route::delete('/bast/{id}', [
        BASTController::class,
        'destroy'
    ]);


    /*
    |--------------------------------------------------------------------------
    | BAUF PDF
    |--------------------------------------------------------------------------
    */

    Route::get('/bauf/next-nomor', [
        BAUFController::class,
        'getNextNomorSurat'
    ]);

    Route::post('/bauf/pdf', [
        BAUFController::class,
        'generatePDF'
    ]);

    Route::get('/bauf/history', [
        BAUFController::class,
        'getHistory'
    ]);

    Route::get('/bauf/{id}/pdf', [
        BAUFController::class,
        'regeneratePDF'
    ]);

    Route::delete('/bauf/{id}', [
        BAUFController::class,
        'destroy'
    ]);

    /*
    |--------------------------------------------------------------------------
    | BAM PDF
    |--------------------------------------------------------------------------
    */

    Route::get('/bam/next-nomor', [
        BAMController::class,
        'getNextNomorSurat'
    ]);

    Route::get('/bam/history', [
        BAMController::class,
        'getHistory'
    ]);

    Route::post('/bam/pdf', [
        BAMController::class,
        'generatePDF'
    ]);

    Route::get('/bam/{id}/pdf', [
        BAMController::class,
        'regeneratePDF'
    ]);

    Route::delete('/bam/{id}', [
        BAMController::class,
        'destroy'
    ]);

    /*
    |--------------------------------------------------------------------------
    | SPPD PDF
    |--------------------------------------------------------------------------
    */

    Route::get('/sppd/next-nomor', [
        SPPDController::class,
        'getNextNomorSurat'
    ]);

    Route::get('/sppd/history', [
        SPPDController::class,
        'getHistory'
    ]);

    Route::post('/sppd', [
        SPPDController::class,
        'store'
    ]);

    Route::get('/sppd/{id}', [
        SPPDController::class,
        'show'
    ]);

    Route::put('/sppd/{id}', [
        SPPDController::class,
        'update'
    ]);

    Route::post('/sppd/pdf', [
        SPPDController::class,
        'generatePDF'
    ]);

    Route::get('/sppd/{id}/pdf', [
        SPPDController::class,
        'regeneratePDF'
    ]);

    Route::delete('/sppd/{id}', [
        SPPDController::class,
        'destroy'
    ]);

});