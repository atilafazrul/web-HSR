<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use Laravel\Sanctum\PersonalAccessToken;

class UserController extends Controller
{
    // ================= HELPER: GET USER FROM TOKEN =================
    private function getUserFromToken($token)
    {
        try {
            $tokenModel = PersonalAccessToken::findToken($token);
            if (!$tokenModel) {
                return null;
            }
            return $tokenModel->tokenable;
        } catch (\Exception $e) {
            \Log::error('Get user from token error: ' . $e->getMessage());
            return null;
        }
    }

    // ================= HELPER: AUTHORIZATION DOWNLOAD ACCESS =================
    private function canAccessEmployeeDocument($authenticatedUser, $targetUserId)
    {
        if (!$authenticatedUser) {
            return false;
        }

        // User boleh akses dokumen miliknya sendiri
        if ((int) $authenticatedUser->id === (int) $targetUserId) {
            return true;
        }

        // Role tertentu boleh akses dokumen seluruh karyawan
        return in_array($authenticatedUser->role, ['admin', 'super_admin'], true);
    }

    // ================= LIST =================
    public function index()
    {
        $users = User::where('role', '!=', 'super_admin')->get();

        $users->transform(function ($user) {
            $user->ijazah = $this->cleanArray($user->ijazah);
            $user->sertifikat = $this->cleanArray($user->sertifikat);
            return $user;
        });

        return response()->json($users);
    }

    // ================= DETAIL =================
    public function show($id)
    {
        $user = User::findOrFail($id);

        $user->ijazah = $this->cleanArray($user->ijazah);
        $user->sertifikat = $this->cleanArray($user->sertifikat);

        return response()->json($user);
    }

    // ================= GET PROFILE =================
    public function getProfile(Request $request)
    {
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
    }

    // ================= UPDATE PROFILE =================
    public function updateProfile(Request $request)
    {
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

        $updateData = array_filter($validated, function($key) {
            return in_array($key, ['name', 'email', 'phone', 'no_telepon', 'alamat']);
        }, ARRAY_FILTER_USE_KEY);

        $user->update($updateData);
        $user->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Profile berhasil diupdate',
            'user' => $user
        ]);
    }

    // ================= UPDATE PROFILE PHOTO =================
    public function updateProfilePhoto(Request $request)
    {
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
    }

    // ================= DELETE PROFILE PHOTO =================
    public function deleteProfilePhoto(Request $request)
    {
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
    }

    // ================= CREATE =================
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'role' => 'required|string|in:admin,user',
            'divisi' => 'nullable|string',
            'password' => 'required|min:6'
        ]);

        return response()->json(User::create($validated));
    }

    // ================= UPDATE + UPLOAD =================
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'nik' => 'nullable|string|max:20',
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:20',
            'no_telepon' => 'nullable|string|max:20',
            'alamat' => 'nullable|string',
            'tempat_lahir' => 'nullable|string',
            'tanggal_lahir' => 'nullable|date',
            'jenis_kelamin' => 'nullable|string',
            'agama' => 'nullable|string',
            'status_perkawinan' => 'nullable|string',
            'pekerjaan' => 'nullable|string',
            'golongan_darah' => 'nullable|string',
            'kontak_darurat_nama' => 'nullable|string',
            'kontak_darurat_hubungan' => 'nullable|string',
            'kontak_darurat_telepon' => 'nullable|string|max:20',
            'kontak_darurat_alamat' => 'nullable|string',
            'password' => 'nullable|string|min:6',
            'ktp' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'kk' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'akte' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'ijazah.*' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'sertifikat.*' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
        ]);

        unset($validated['ijazah']);
        unset($validated['sertifikat']);

        if ($request->filled('password')) {
            $validated['password'] = $request->password;
        } else {
            unset($validated['password']);
        }

        if ($request->has('no_telepon') && !$request->has('phone')) {
            $validated['phone'] = $request->no_telepon;
        }

        if ($request->has('phone') && !$request->has('no_telepon')) {
            $validated['no_telepon'] = $request->phone;
        }

        $user->fill($validated);

        $saveEncrypted = function ($file, $prefix) {
            try {
                $content = file_get_contents($file->getRealPath());
                $encrypted = Crypt::encrypt($content);
                $filename = $prefix . '_' . time() . '_' . uniqid() . '.enc';
                $path = 'secure/' . $filename;
                Storage::disk('public')->put($path, $encrypted);
                return $path;
            } catch (\Exception $e) {
                \Log::error('Error encrypt file: ' . $e->getMessage());
                return null;
            }
        };

        if ($request->hasFile('ktp')) {
            if ($user->ktp && Storage::disk('public')->exists($user->ktp)) {
                Storage::disk('public')->delete($user->ktp);
            }
            $user->ktp = $saveEncrypted($request->file('ktp'), 'ktp');
        }

        if ($request->hasFile('kk')) {
            if ($user->kk && Storage::disk('public')->exists($user->kk)) {
                Storage::disk('public')->delete($user->kk);
            }
            $user->kk = $saveEncrypted($request->file('kk'), 'kk');
        }

        if ($request->hasFile('akte')) {
            if ($user->akte && Storage::disk('public')->exists($user->akte)) {
                Storage::disk('public')->delete($user->akte);
            }
            $user->akte = $saveEncrypted($request->file('akte'), 'akte');
        }

        if ($request->hasFile('ijazah')) {
            $existingIjazah = [];
            $rawIjazah = $user->getOriginal('ijazah');

            if (!empty($rawIjazah)) {
                if (is_string($rawIjazah)) {
                    $existingIjazah = json_decode($rawIjazah, true) ?: [];
                } elseif (is_array($rawIjazah)) {
                    $existingIjazah = $rawIjazah;
                }
            }

            $existingIjazah = array_filter($existingIjazah, function ($item) {
                return is_string($item) && !empty($item);
            });
            $existingIjazah = array_values($existingIjazah);

            foreach ($request->file('ijazah') as $file) {
                $encryptedPath = $saveEncrypted($file, 'ijazah');
                if ($encryptedPath) {
                    $existingIjazah[] = $encryptedPath;
                }
            }

            $user->ijazah = $existingIjazah;
        }

        if ($request->hasFile('sertifikat')) {
            $existingSertifikat = [];
            $rawSertifikat = $user->getOriginal('sertifikat');

            if (!empty($rawSertifikat)) {
                if (is_string($rawSertifikat)) {
                    $existingSertifikat = json_decode($rawSertifikat, true) ?: [];
                } elseif (is_array($rawSertifikat)) {
                    $existingSertifikat = $rawSertifikat;
                }
            }

            $existingSertifikat = array_filter($existingSertifikat, function ($item) {
                return is_string($item) && !empty($item);
            });
            $existingSertifikat = array_values($existingSertifikat);

            foreach ($request->file('sertifikat') as $file) {
                $encryptedPath = $saveEncrypted($file, 'sertifikat');
                if ($encryptedPath) {
                    $existingSertifikat[] = $encryptedPath;
                }
            }

            $user->sertifikat = $existingSertifikat;
        }

        $user->save();

        $responseData = $user->toArray();
        $responseData['ijazah'] = $this->cleanArray($user->ijazah);
        $responseData['sertifikat'] = $this->cleanArray($user->sertifikat);

        return response()->json([
            'success' => true,
            'message' => 'Data + dokumen berhasil disimpan 🔐',
            'user' => $responseData
        ]);
    }

    // ================= DELETE FILE =================
    public function deleteFile(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);
            $type = $request->type;
            $index = $request->index;

            if (!in_array($type, ['ijazah', 'sertifikat'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tipe file tidak valid'
                ], 400);
            }

            $files = [];
            $rawData = $user->getOriginal($type);

            if (!empty($rawData)) {
                if (is_string($rawData)) {
                    $files = json_decode($rawData, true) ?: [];
                } elseif (is_array($rawData)) {
                    $files = $rawData;
                }
            }

            $files = array_filter($files, function ($item) {
                return is_string($item) && !empty($item);
            });
            $files = array_values($files);

            if (!isset($files[$index])) {
                return response()->json([
                    'success' => false,
                    'message' => 'File tidak ditemukan'
                ], 404);
            }

            $filePath = $files[$index];
            if (Storage::disk('public')->exists($filePath)) {
                Storage::disk('public')->delete($filePath);
            }

            array_splice($files, $index, 1);
            $files = array_values($files);

            $user->$type = $files;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'File berhasil dihapus',
                'files' => $files
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus file: ' . $e->getMessage()
            ], 500);
        }
    }

    // ================= HELPER: CLEAN ARRAY =================
    private function cleanArray($data)
    {
        if (is_string($data)) {
            $data = json_decode($data, true) ?: [];
        }

        if (!is_array($data)) {
            return [];
        }

        $result = [];
        foreach ($data as $item) {
            if (is_string($item) && !empty($item)) {
                $result[] = $item;
            }
        }

        return array_values($result);
    }

    // ================= DOWNLOAD FILE WITH TOKEN SUPPORT =================
    public function downloadKtp($id, Request $request)
    {
        $token = $request->bearerToken() ?? $request->query('token');
        
        if ($token) {
            $user = $this->getUserFromToken($token);
            if ($this->canAccessEmployeeDocument($user, $id)) {
                return $this->decryptFile($id, 'ktp', 'ktp', $request);
            }
        }
        
        if ($this->canAccessEmployeeDocument(auth()->user(), $id)) {
            return $this->decryptFile($id, 'ktp', 'ktp', $request);
        }
        
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    public function downloadKk($id, Request $request)
    {
        $token = $request->bearerToken() ?? $request->query('token');
        
        if ($token) {
            $user = $this->getUserFromToken($token);
            if ($this->canAccessEmployeeDocument($user, $id)) {
                return $this->decryptFile($id, 'kk', 'kk', $request);
            }
        }
        
        if ($this->canAccessEmployeeDocument(auth()->user(), $id)) {
            return $this->decryptFile($id, 'kk', 'kk', $request);
        }
        
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    public function downloadAkte($id, Request $request)
    {
        $token = $request->bearerToken() ?? $request->query('token');
        
        if ($token) {
            $user = $this->getUserFromToken($token);
            if ($this->canAccessEmployeeDocument($user, $id)) {
                return $this->decryptFile($id, 'akte', 'akte', $request);
            }
        }
        
        if ($this->canAccessEmployeeDocument(auth()->user(), $id)) {
            return $this->decryptFile($id, 'akte', 'akte', $request);
        }
        
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    public function downloadIjazah($id, Request $request)
    {
        $token = $request->bearerToken() ?? $request->query('token');
        $index = $request->query('index', 0);
        
        if ($token) {
            $user = $this->getUserFromToken($token);
            if ($this->canAccessEmployeeDocument($user, $id)) {
                $targetUser = User::findOrFail($id);
                $ijazahFiles = $this->cleanArray($targetUser->ijazah);
                if (!isset($ijazahFiles[$index])) {
                    return response()->json(['message' => 'File Ijazah tidak ditemukan'], 404);
                }
                return $this->decryptFileByPath($ijazahFiles[$index], 'ijazah_' . ($index + 1), $request);
            }
        }
        
        if ($this->canAccessEmployeeDocument(auth()->user(), $id)) {
            $targetUser = User::findOrFail($id);
            $ijazahFiles = $this->cleanArray($targetUser->ijazah);
            if (!isset($ijazahFiles[$index])) {
                return response()->json(['message' => 'File Ijazah tidak ditemukan'], 404);
            }
            return $this->decryptFileByPath($ijazahFiles[$index], 'ijazah_' . ($index + 1), $request);
        }
        
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    public function downloadSertifikat($id, Request $request)
    {
        $token = $request->bearerToken() ?? $request->query('token');
        $index = $request->query('index', 0);
        
        if ($token) {
            $user = $this->getUserFromToken($token);
            if ($this->canAccessEmployeeDocument($user, $id)) {
                $targetUser = User::findOrFail($id);
                $sertifikatFiles = $this->cleanArray($targetUser->sertifikat);
                if (!isset($sertifikatFiles[$index])) {
                    return response()->json(['message' => 'File Sertifikat tidak ditemukan'], 404);
                }
                return $this->decryptFileByPath($sertifikatFiles[$index], 'sertifikat_' . ($index + 1), $request);
            }
        }
        
        if ($this->canAccessEmployeeDocument(auth()->user(), $id)) {
            $targetUser = User::findOrFail($id);
            $sertifikatFiles = $this->cleanArray($targetUser->sertifikat);
            if (!isset($sertifikatFiles[$index])) {
                return response()->json(['message' => 'File Sertifikat tidak ditemukan'], 404);
            }
            return $this->decryptFileByPath($sertifikatFiles[$index], 'sertifikat_' . ($index + 1), $request);
        }
        
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    private function decryptFile($id, $field, $name, Request $request)
    {
        $user = User::findOrFail($id);

        if (!$user->$field) {
            return response()->json(['message' => 'File tidak ada di database'], 404);
        }

        $path = $user->$field;
        if (!is_string($path) || !Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'File tidak ditemukan di storage'], 404);
        }

        return $this->decryptFileByPath($path, $name, $request);
    }

    private function decryptFileByPath($path, $name, Request $request)
    {
        try {
            if (!is_string($path)) {
                return response()->json(['message' => 'Path file tidak valid'], 400);
            }

            $encrypted = Storage::disk('public')->get($path);
            $decrypted = Crypt::decrypt($encrypted);

            $finfo = finfo_open();
            $mime = finfo_buffer($finfo, $decrypted, FILEINFO_MIME_TYPE);
            finfo_close($finfo);

            $extension = match ($mime) {
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'application/pdf' => 'pdf',
                default => 'bin',
            };

            $isDownload = $request->query('download', false);
            $disposition = $isDownload ? 'attachment' : 'inline';

            return response($decrypted)
                ->header('Content-Type', $mime)
                ->header('Content-Disposition', $disposition . '; filename="' . $name . '.' . $extension . '"');

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal decrypt file: ' . $e->getMessage()
            ], 500);
        }
    }

    // ================= DELETE =================
    public function destroy($id)
    {
        $user = User::findOrFail($id);

        $fields = ['ktp', 'kk', 'akte', 'ijazah', 'sertifikat'];

        foreach ($fields as $field) {
            if (in_array($field, ['ijazah', 'sertifikat'])) {
                $files = $this->cleanArray($user->$field);
                foreach ($files as $file) {
                    if (Storage::disk('public')->exists($file)) {
                        Storage::disk('public')->delete($file);
                    }
                }
            } else {
                if ($user->$field && Storage::disk('public')->exists($user->$field)) {
                    Storage::disk('public')->delete($user->$field);
                }
            }
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Karyawan berhasil dihapus'
        ]);
    }
}