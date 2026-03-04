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
use App\Http\Controllers\ServiceReportController;
use App\Http\Controllers\UserController;


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
        'name' => 'required|string|max:255',
        'email' => 'required|email|max:255'
    ]);

    $user = User::find($validated['user_id']);

    if (!$user) {

        return response()->json([
            'success' => false,
            'message' => 'User tidak ditemukan'
        ], 404);

    }

    $user->update($validated);

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