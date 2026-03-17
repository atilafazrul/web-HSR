<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;

/* ================= MODEL ================= */
use App\Models\User;

/* ================= CONTROLLER ================= */
use App\Http\Controllers\ProjekKerjaController;
use App\Http\Controllers\FormPekerjaanController;
use App\Http\Controllers\BarangController;
use App\Http\Controllers\LogistikInventoryController;
use App\Http\Controllers\PembelianController;
use App\Http\Controllers\ServiceReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\BASTController;


/*
|--------------------------------------------------------------------------
| AUTH API
|--------------------------------------------------------------------------
*/

Route::post('/login', function (Request $request) {

    $validated = $request->validate([
        'email' => 'required|email',
        'password' => 'required'
    ]);

    $user = User::where('email', $validated['email'])->first();

    if (!$user || !Hash::check($validated['password'], $user->password)) {

        return response()->json([
            'success' => false,
            'message' => 'Email atau password salah'
        ], 401);

    }

    return response()->json([
        'success' => true,
        'message' => 'Login berhasil',
        'user' => $user
    ]);

});


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