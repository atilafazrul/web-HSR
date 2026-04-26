<?php

namespace App\Http\Controllers;

use App\Models\ProjekKerja;
use App\Models\ProjekKerjaPhoto;
use App\Models\ProjekKerjaFile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ProjekKerjaController extends Controller
{
    protected function sanitizeUploadedFileName(string $fileName): string
    {
        $info = pathinfo($fileName);
        $name = trim((string) ($info['filename'] ?? ''));
        $ext = trim((string) ($info['extension'] ?? ''));

        $name = preg_replace('/[^a-zA-Z0-9._ -]/', '', $name);
        $name = preg_replace('/\s+/', ' ', (string) $name);
        $name = trim((string) $name);
        if ($name === '') {
            $name = 'upload';
        }

        $ext = preg_replace('/[^a-zA-Z0-9]/', '', $ext);
        if ($ext !== '') {
            return $name . '.' . strtolower($ext);
        }

        return $name;
    }

    protected function storePublicFileWithOriginalName($uploadedFile, string $targetDir): string
    {
        $originalName = $this->sanitizeUploadedFileName((string) $uploadedFile->getClientOriginalName());
        $info = pathinfo($originalName);
        $base = (string) ($info['filename'] ?? 'upload');
        $ext = trim((string) ($info['extension'] ?? ''));
        $candidate = $originalName;
        $counter = 1;

        while (Storage::disk('public')->exists(trim($targetDir, '/') . '/' . $candidate)) {
            $candidate = $base . ' (' . $counter . ')' . ($ext !== '' ? '.' . $ext : '');
            $counter++;
        }

        return $uploadedFile->storeAs($targetDir, $candidate, 'public');
    }

    protected function normalizeInvitedUsers(Request $request, array $validated): array
    {
        $raw = $validated['invited_user_ids'] ?? $request->input('invited_user_ids', []);
        if (is_string($raw)) {
            $raw = explode(',', $raw);
        }
        if (!is_array($raw)) {
            $raw = [];
        }

        return collect($raw)
            ->map(fn ($name) => trim((string) $name))
            ->filter(fn ($name) => $name !== '')
            ->unique()
            ->values()
            ->all();
    }

    protected function sanitizeFolderName(?string $name): ?string
    {
        $raw = trim((string) $name);
        if ($raw === '') {
            return null;
        }

        $sanitized = preg_replace('/[^a-zA-Z0-9 _-]/', '', $raw);
        $sanitized = preg_replace('/\s+/', '_', (string) $sanitized);
        $sanitized = trim((string) $sanitized, '_- ');

        return $sanitized !== '' ? $sanitized : null;
    }

    protected function buildProjectMediaPath(string $baseDir, int $projectId, ?string $folderName = null): string
    {
        $path = $baseDir . '/' . $projectId;
        $folder = $this->sanitizeFolderName($folderName);
        if ($folder) {
            $path .= '/' . $folder;
        }

        return $path;
    }

    protected function resolveDefaultPicFromDivisi(?string $targetDivisi): ?string
    {
        $target = strtolower(trim((string) $targetDivisi));
        if ($target === '') {
            return null;
        }

        $user = User::query()
            ->whereRaw('LOWER(divisi) = ?', [$target])
            ->whereRaw(
                "REPLACE(REPLACE(LOWER(role), ' ', '_'), '-', '_') NOT IN (?, ?)",
                ['super_admin', 'user']
            )
            ->orderByDesc('id')
            ->first();

        return $user?->name ? trim((string) $user->name) : null;
    }

    /**
     * Ambil PIC berdasarkan divisi tujuan dari kandidat karyawan.
     * Prioritas: kandidat terakhir yang divisinya cocok.
     */
    protected function resolvePicByDivisi(?string $targetDivisi, array $candidates, ?string $fallback = null): ?string
    {
        $names = array_values(array_filter(array_map(
            fn ($v) => trim((string) $v),
            $candidates
        )));
        $fallback = $fallback !== null ? trim((string) $fallback) : null;
        if ($fallback === '') {
            $fallback = null;
        }

        if (empty($names)) {
            return $fallback ?: null;
        }

        $target = strtolower(trim((string) $targetDivisi));
        if ($target === '') {
            return $this->resolveDefaultPicFromDivisi($targetDivisi);
        }

        $users = User::query()
            ->whereRaw('LOWER(divisi) = ?', [$target])
            ->whereRaw(
                "REPLACE(REPLACE(LOWER(role), ' ', '_'), '-', '_') NOT IN (?, ?)",
                ['super_admin', 'user']
            )
            ->pluck('name')
            ->map(fn ($n) => strtolower(trim((string) $n)))
            ->filter()
            ->values()
            ->all();
        $nameSet = array_fill_keys($users, true);

        // Jika user memilih PIC secara eksplisit dan role-nya valid, jangan dioverride otomatis.
        if ($fallback && isset($nameSet[strtolower($fallback)])) {
            return $fallback;
        }

        for ($i = count($names) - 1; $i >= 0; $i--) {
            $key = strtolower($names[$i]);
            if (isset($nameSet[$key])) {
                return $names[$i];
            }
        }

        $defaultByDivisi = $this->resolveDefaultPicFromDivisi($targetDivisi);
        if ($defaultByDivisi) {
            return $defaultByDivisi;
        }

        return null;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = ProjekKerja::query();
        $authUser = auth()->user();
        $normalizedRole = strtolower(trim((string) ($authUser->role ?? '')));
        $normalizedRole = str_replace([' ', '-'], '_', $normalizedRole);
        $archiveFlag = filter_var($request->query('archive', false), FILTER_VALIDATE_BOOLEAN);
        $query->where('is_archived', $archiveFlag);

        // User biasa hanya boleh monitor proyek yang benar-benar di-invite.
        // invited_user_ids disimpan sebagai nama user (string).
        // Tetap dukung data lama berbasis ID untuk kompatibilitas.
        if ($authUser && $normalizedRole === 'user') {
            $userId = (int) $authUser->id;
            $userName = trim((string) ($authUser->name ?? ''));
            $query->where(function ($q) use ($userId, $userName) {
                $q->whereJsonContains('invited_user_ids', $userId);
                if ($userName !== '') {
                    $q->orWhereJsonContains('invited_user_ids', $userName);
                }
            });
        }

        // Filter by divisi if provided
        // Untuk data aktif: hanya divisi saat ini.
        // Untuk archive: boleh tampil juga yang pernah lewat divisi ini (divisi_flow).
        if ($normalizedRole !== 'user' && $request->has('divisi') && $request->divisi) {
            $divisiFilter = strtolower($request->divisi);
            if ($archiveFlag) {
                $query->where(function($q) use ($divisiFilter) {
                    $q->whereRaw('LOWER(divisi) = ?', [$divisiFilter])
                      ->orWhere('divisi_flow', 'like', '%' . $divisiFilter . '%');
                });
            } else {
                $query->where(function($q) use ($divisiFilter) {
                    $q->whereRaw('LOWER(divisi) = ?', [$divisiFilter])
                      ->orWhere('divisi_flow', 'like', '%' . $divisiFilter . '%');
                });
            }
        }

        $projek = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $projek
        ]);
    }

    public function archive(Request $request, $id)
    {
        $projek = ProjekKerja::find($id);
        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan',
            ], 404);
        }

        if (strtolower(trim((string) $projek->status)) !== 'selesai') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya project dengan status Selesai yang bisa di-archive.',
            ], 422);
        }

        $projek->update([
            'is_archived' => true,
            'archived_at' => now(),
            'archived_status' => $projek->status,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Project berhasil dipindah ke archive.',
            'data' => $projek->fresh(),
        ]);
    }

    public function unarchive(Request $request, $id)
    {
        $projek = ProjekKerja::find($id);
        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan',
            ], 404);
        }

        $restoreStatus = $projek->archived_status ?: $projek->status ?: 'Selesai';
        $projek->update([
            'is_archived' => false,
            'archived_at' => null,
            'status' => $restoreStatus,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Archive dibatalkan. Project kembali ke progres.',
            'data' => $projek->fresh(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'divisi' => 'required|string',
            'sender_divisi' => 'nullable|string',
            'jenis_pekerjaan' => 'required|string',
            'karyawan' => 'required|string',
            'alamat' => 'required|string',
            'status' => 'required|string',
            'start_date' => 'required|date',
            'problem_description' => 'nullable|string',
            'barang_dibeli' => 'nullable|string',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx|max:10240',
            'photos' => 'nullable|array',
            'photos.*' => 'image|mimes:jpeg,png,jpg,gif|max:10240',
            'divisi_flow' => 'nullable|array',
            'pic_karyawan' => 'nullable|string',
            'karyawan_terlibat' => 'nullable|array',
            'invited_user_ids' => 'nullable|array',
            'invited_user_ids.*' => 'string',
            'folder_name' => 'nullable|string|max:100',
            'file_folder_name' => 'nullable|string|max:100',
            'photo_folder_name' => 'nullable|string|max:100',
        ]);

        DB::beginTransaction();
        try {
            // Generate report_no automatically - Format: SRXXX/HSR/YYMMDD
            $lastProject = ProjekKerja::orderBy('id', 'desc')->first();
            $lastId = $lastProject ? $lastProject->id : 0;
            $newId = $lastId + 1;
            $reportNo = 'SR' . str_pad($newId, 3, '0', STR_PAD_LEFT) . '/HSR/' . date('ymd');

            // created_by_divisi = divisi pengirim saat membuat project.
            // Untuk superadmin (divisi akun bisa null), ambil dari sender_divisi (konteks halaman).
            $createdByDivisi = trim((string) (
                $validated['sender_divisi']
                ?? auth()->user()->divisi
                ?? $validated['divisi']
                ?? 'Sales'
            ));
            if ($createdByDivisi === '') {
                $createdByDivisi = $validated['divisi'] ?? 'Sales';
            }

            // Initialize divisi_flow berdasarkan user yang membuat dan divisi yang dipilih
            // Flow dimulai dari user yang membuat, lalu divisi target
            $divisiFlow = [strtolower($createdByDivisi)];
            if (strtolower($validated['divisi']) !== strtolower($createdByDivisi)) {
                $divisiFlow[] = strtolower($validated['divisi']);
            }

            // Parse karyawan (string dengan nama dipisahkan koma) menjadi array
            // Gunakan ini untuk pic_karyawan dan karyawan_terlibat
            $karyawanString = $validated['karyawan'] ?? '';
            $karyawanArray = [];
            if (!empty($karyawanString)) {
                // Pisahkan string berdasarkan koma dan trim whitespace
                $karyawanArray = array_map('trim', explode(',', $karyawanString));
                // Hapus nilai kosong
                $karyawanArray = array_filter($karyawanArray, function($val) {
                    return !empty($val);
                });
                // Re-index array
                $karyawanArray = array_values($karyawanArray);
            }

            // pic_karyawan dipilih berdasar divisi aktif (fallback: kandidat terakhir)
            $picKaryawan = $this->resolvePicByDivisi(
                $validated['divisi'] ?? null,
                $karyawanArray
            );

            // karyawan_terlibat berisi semua karyawan yang dipilih
            $karyawanTerlibat = $karyawanArray;

            // Jika karyawan_terlibat dikirim, pakai sebagai sumber kandidat.
            $karyawanTerlibat = $validated['karyawan_terlibat'] ?? $karyawanTerlibat;
            $picKaryawan = $this->resolvePicByDivisi(
                $validated['divisi'] ?? null,
                $karyawanTerlibat,
                $validated['pic_karyawan'] ?? $picKaryawan
            );
            if ($picKaryawan && !in_array($picKaryawan, $karyawanTerlibat, true)) {
                $karyawanTerlibat[] = $picKaryawan;
            }
            $invitedUserIds = $this->normalizeInvitedUsers($request, $validated);

            $data = [
                'report_no' => $reportNo,
                'divisi' => $validated['divisi'],
                'created_by_divisi' => $createdByDivisi,
                'jenis_pekerjaan' => $validated['jenis_pekerjaan'],
                'karyawan' => $karyawanString,
                'alamat' => $validated['alamat'],
                'status' => $validated['status'],
                'start_date' => $validated['start_date'],
                'problem_description' => $validated['problem_description'] ?? null,
                'barang_dibeli' => $validated['barang_dibeli'] ?? null,
                'is_archived' => false,
                'divisi_flow' => $divisiFlow,
                'pic_karyawan' => $picKaryawan,
                'karyawan_terlibat' => $karyawanTerlibat,
                'invited_user_ids' => !empty($invitedUserIds) ? $invitedUserIds : null,
                'status_history' => [
                    [
                        'status' => $validated['status'],
                        'updated_at' => now()->toDateTimeString(),
                        'updated_by' => auth()->user()->name ?? 'System',
                    ]
                ],
            ];

            $projek = ProjekKerja::create($data);

            // Optional: buat folder awal saat create project (tanpa upload file/foto dulu).
            $initialFileFolder = $this->sanitizeFolderName($validated['file_folder_name'] ?? null);
            if ($initialFileFolder) {
                Storage::disk('public')->makeDirectory(
                    $this->buildProjectMediaPath('projek-kerja-files', (int) $projek->id, $initialFileFolder)
                );
            }
            $initialPhotoFolder = $this->sanitizeFolderName($validated['photo_folder_name'] ?? null);
            if ($initialPhotoFolder) {
                Storage::disk('public')->makeDirectory(
                    $this->buildProjectMediaPath('projek-kerja-photos', (int) $projek->id, $initialPhotoFolder)
                );
            }

            // Handle file upload
            if ($request->hasFile('file')) {
                $filePath = $this->buildProjectMediaPath('projek-kerja-files', (int) $projek->id, $validated['folder_name'] ?? null);
                $path = $this->storePublicFileWithOriginalName($request->file('file'), $filePath);
                $projek->update(['file_url' => asset('storage/' . $path)]);
                // Simpan juga ke tabel dokumentasi supaya langsung muncul di halaman Foto/Dokumen Projek.
                ProjekKerjaFile::create([
                    'projek_kerja_id' => $projek->id,
                    'file' => $path,
                    'name' => $request->file('file')->getClientOriginalName(),
                ]);
            }

            // Handle photo uploads
            if ($request->hasFile('photos')) {
                $photoPathBase = $this->buildProjectMediaPath('projek-kerja-photos', (int) $projek->id, $validated['folder_name'] ?? null);
                foreach ($request->file('photos') as $photo) {
                    $photoPath = $this->storePublicFileWithOriginalName($photo, $photoPathBase);
                    ProjekKerjaPhoto::create([
                        'projek_kerja_id' => $projek->id,
                        'photo' => $photoPath,
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Projek kerja berhasil ditambahkan',
                'data' => $projek->load(['photos', 'files'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan projek kerja: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $projek = ProjekKerja::with(['photos', 'files'])->find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $projek
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $projek = ProjekKerja::find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'divisi' => 'sometimes|required|string',
            'jenis_pekerjaan' => 'sometimes|required|string',
            'karyawan' => 'sometimes|required|string',
            'alamat' => 'sometimes|required|string',
            'status' => 'sometimes|required|string',
            'start_date' => 'sometimes|required|date',
            'problem_description' => 'nullable|string',
            'barang_dibeli' => 'nullable|string',
            'divisi_flow' => 'nullable|array',
            'pic_karyawan' => 'nullable|string',
            'karyawan_terlibat' => 'nullable|array',
            'invited_user_ids' => 'nullable|array',
            'invited_user_ids.*' => 'string',
        ]);

        DB::beginTransaction();
        try {
            $data = [];
            $statusChanged = false;
            $newStatus = null;

            // Ambil divisi_flow yang ada sekarang
            $existingDivisiFlow = $projek->divisi_flow ?? [];

            if (isset($validated['divisi'])) {
                $data['divisi'] = $validated['divisi'];

                // Update divisi_flow jika divisi berubah
                if ($projek->divisi !== $validated['divisi']) {
                    $flow = is_array($existingDivisiFlow) ? $existingDivisiFlow : json_decode($existingDivisiFlow, true) ?? [];

                    // Helper function untuk case-insensitive check
                    $inArrayCaseInsensitive = function($needle, $haystack) {
                        foreach ($haystack as $item) {
                            if (strtolower($item) === strtolower($needle)) {
                                return true;
                            }
                        }
                        return false;
                    };

                    // Tambahkan divisi LAMA ke flow jika belum ada (case-insensitive)
                    if (!$inArrayCaseInsensitive($projek->divisi, $flow)) {
                        $flow[] = strtolower($projek->divisi);
                    }

                    // Tambahkan divisi BARU ke flow jika belum ada (case-insensitive)
                    if (!$inArrayCaseInsensitive($validated['divisi'], $flow)) {
                        $flow[] = strtolower($validated['divisi']);
                    }

                    $data['divisi_flow'] = $flow;
                }

                // created_by_divisi tetap tidak berubah (divisi awal pembuatan)
                // Tidak set $data['created_by_divisi'] agar tetap dari database
            }
            if (isset($validated['jenis_pekerjaan'])) {
                $data['jenis_pekerjaan'] = $validated['jenis_pekerjaan'];
            }
            if (isset($validated['alamat'])) {
                $data['alamat'] = $validated['alamat'];
            }
            if (isset($validated['status'])) {
                if ($projek->status !== $validated['status']) {
                    $statusChanged = true;
                    $newStatus = $validated['status'];
                }
                $data['status'] = $validated['status'];
                $isSelesai = strtolower(trim((string) $validated['status'])) === 'selesai';
                if ($isSelesai) {
                    $data['is_archived'] = true;
                    $data['archived_at'] = now();
                    $data['archived_status'] = $validated['status'];
                }
            }
            if (isset($validated['start_date'])) {
                $data['start_date'] = $validated['start_date'];
            }
            if (isset($validated['problem_description'])) {
                $data['problem_description'] = $validated['problem_description'];
            }
            if (isset($validated['barang_dibeli'])) {
                $data['barang_dibeli'] = $validated['barang_dibeli'];
            }
            if (array_key_exists('invited_user_ids', $validated)) {
                $invitedUserIds = $this->normalizeInvitedUsers($request, $validated);
                $data['invited_user_ids'] = !empty($invitedUserIds) ? $invitedUserIds : null;
            }

            // Parse karyawan (string dengan nama dipisahkan koma) menjadi array
            // pic_karyawan adalah karyawan terakhir (pemegang terkini), karyawan_terlibat berisi semua karyawan
            if (isset($validated['karyawan'])) {
                $karyawanString = $validated['karyawan'] ?? '';
                $karyawanArray = [];
                if (!empty($karyawanString)) {
                    // Pisahkan string berdasarkan koma dan trim whitespace
                    $karyawanArray = array_map('trim', explode(',', $karyawanString));
                    // Hapus nilai kosong
                    $karyawanArray = array_filter($karyawanArray, function($val) {
                        return !empty($val);
                    });
                    // Re-index array
                    $karyawanArray = array_values($karyawanArray);
                }

                $karyawanTerlibat = isset($validated['karyawan_terlibat']) && is_array($validated['karyawan_terlibat'])
                    ? $validated['karyawan_terlibat']
                    : $karyawanArray;
                $targetDivisi = $validated['divisi'] ?? ($data['divisi'] ?? $projek->divisi);
                $picKaryawan = $this->resolvePicByDivisi(
                    $targetDivisi,
                    $karyawanTerlibat,
                    $validated['pic_karyawan'] ?? null
                );
                if ($picKaryawan && !in_array($picKaryawan, $karyawanTerlibat, true)) {
                    $karyawanTerlibat[] = $picKaryawan;
                }

                $data['pic_karyawan'] = $picKaryawan;
                $data['karyawan_terlibat'] = $karyawanTerlibat;
                $data['karyawan'] = implode(', ', $karyawanTerlibat);
            } elseif (isset($validated['pic_karyawan']) || isset($validated['karyawan_terlibat'])) {
                // Jika ada explicit pic_karyawan atau karyawan_terlibat tanpa karyawan
                $karyawanTerlibat = $validated['karyawan_terlibat'] ?? ($projek->karyawan_terlibat ?? []);
                $targetDivisi = $validated['divisi'] ?? ($data['divisi'] ?? $projek->divisi);
                $resolvedPic = $this->resolvePicByDivisi(
                    $targetDivisi,
                    $karyawanTerlibat,
                    $validated['pic_karyawan'] ?? null
                );
                if ($resolvedPic && !in_array($resolvedPic, $karyawanTerlibat, true)) {
                    $karyawanTerlibat[] = $resolvedPic;
                }
                $data['pic_karyawan'] = $resolvedPic;
                $data['karyawan_terlibat'] = $karyawanTerlibat;
                $data['karyawan'] = implode(', ', $karyawanTerlibat);
            }

            // Update status history if status changed
            if ($statusChanged && $newStatus) {
                $history = $projek->status_history ?? [];
                $history[] = [
                    'status' => $newStatus,
                    'updated_at' => now()->toDateTimeString(),
                    'updated_by' => auth()->user()->name ?? 'System',
                ];
                $data['status_history'] = $history;
            }

            $projek->update($data);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Projek kerja berhasil diupdate',
                'data' => $projek->load(['photos', 'files'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal update projek kerja: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $projek = ProjekKerja::find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        DB::beginTransaction();
        try {
            // Delete photos from storage
            foreach ($projek->photos as $photo) {
                if (Storage::disk('public')->exists($photo->photo)) {
                    Storage::disk('public')->delete($photo->photo);
                }
                $photo->delete();
            }

            // Delete files from storage
            foreach ($projek->files as $file) {
                if (Storage::disk('public')->exists($file->file)) {
                    Storage::disk('public')->delete($file->file);
                }
                $file->delete();
            }

            // Delete project
            $projek->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Projek kerja berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus projek kerja: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update status of a project
     */
    public function updateStatus(Request $request, $id)
    {
        $projek = ProjekKerja::find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'status' => 'required|string'
        ]);

        try {
            $oldStatus = $projek->status;

            // Update status history
            $history = $projek->status_history ?? [];
            $history[] = [
                'status' => $validated['status'],
                'updated_at' => now()->toDateTimeString(),
                'updated_by' => auth()->user()->name ?? 'System',
            ];

            $projek->update([
                'status' => $validated['status'],
                'status_history' => $history,
                'is_archived' => strtolower(trim((string) $validated['status'])) === 'selesai',
                'archived_at' => strtolower(trim((string) $validated['status'])) === 'selesai' ? now() : null,
                'archived_status' => strtolower(trim((string) $validated['status'])) === 'selesai' ? $validated['status'] : $projek->archived_status,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status berhasil diupdate',
                'data' => $projek
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal update status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update description of a project
     */
    public function updateDescription(Request $request, $id)
    {
        $projek = ProjekKerja::find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'problem_description' => 'nullable|string'
        ]);

        $projek->update([
            'problem_description' => $validated['problem_description']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Deskripsi berhasil diupdate',
            'data' => $projek
        ]);
    }

    /**
     * Update biaya (uang) of a project
     */
    public function updateUang(Request $request, $id)
    {
        $projek = ProjekKerja::find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'biaya_jalan_items' => 'nullable|array',
            'biaya_jalan_items.*.nominal' => 'nullable|numeric|min:0',
            'biaya_jalan_items.*.keterangan' => 'nullable|string',
            'biaya_jalan_items.*.is_lunas' => 'nullable|boolean',
            'biaya_jalan_items.*.oleh' => 'nullable|string',
            'biaya_jalan_items.*.created_at' => 'nullable|string',
            'biaya_pengeluaran_items' => 'nullable|array',
            'biaya_pengeluaran_items.*.nominal' => 'nullable|numeric|min:0',
            'biaya_pengeluaran_items.*.keterangan' => 'nullable|string',
            'biaya_pengeluaran_items.*.is_lunas' => 'nullable|boolean',
            'biaya_pengeluaran_items.*.oleh' => 'nullable|string',
            'biaya_pengeluaran_items.*.created_at' => 'nullable|string',
            'biaya_pengeluaran_items.*.photo_paths' => 'nullable|array',
            'biaya_pengeluaran_items.*.photo_paths.*' => 'nullable|string',
            'biaya_reimbursment_items' => 'nullable|array',
            'biaya_reimbursment_items.*.nominal' => 'nullable|numeric|min:0',
            'biaya_reimbursment_items.*.keterangan' => 'nullable|string',
            'biaya_reimbursment_items.*.is_lunas' => 'nullable|boolean',
            'biaya_reimbursment_items.*.oleh' => 'nullable|string',
            'biaya_reimbursment_items.*.created_at' => 'nullable|string',
            'biaya_reimbursment_items.*.photo_paths' => 'nullable|array',
            'biaya_reimbursment_items.*.photo_paths.*' => 'nullable|string',
            // Foto untuk pengeluaran dan reimbursment
            'pengeluaran_photos' => 'nullable|array',
            'pengeluaran_photos.*' => 'array',
            'pengeluaran_photos.*.*' => 'image|mimes:jpeg,jpg,png,webp|max:5120',
            'reimbursment_photos' => 'nullable|array',
            'reimbursment_photos.*' => 'array',
            'reimbursment_photos.*.*' => 'image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        try {
            $updateData = [];
            $meta = [];
            $userName = auth()->user()->name ?? 'System';
            $isSuperAdmin = (auth()->user()->role ?? null) === 'super_admin';

            // Log untuk debug photo_paths
            \Log::info('updateUang - Validated data:', [
                'biaya_pengeluaran_items' => $validated['biaya_pengeluaran_items'] ?? null,
                'biaya_reimbursment_items' => $validated['biaya_reimbursment_items'] ?? null,
                'has_pengeluaran_photos' => $request->has('pengeluaran_photos'),
                'has_reimbursment_photos' => $request->has('reimbursment_photos'),
                'all_files' => array_keys($request->allFiles()),
                'all_input_keys' => array_keys($request->all()),
            ]);

            // Handle foto upload untuk pengeluaran dan reimbursment
            $storedPhotos = [
                'pengeluaran' => [],
                'reimbursment' => [],
            ];

            // Simpan foto pengeluaran dari struktur nested array: pengeluaran_photos[rowIndex][fileIndex]
            foreach (($request->file('pengeluaran_photos') ?? []) as $rowIndex => $files) {
                foreach ((array) $files as $file) {
                    if ($file && $file->isValid()) {
                        $path = $file->store('biaya-fotos', 'public');
                        if (!isset($storedPhotos['pengeluaran'][$rowIndex])) {
                            $storedPhotos['pengeluaran'][$rowIndex] = [];
                        }
                        $storedPhotos['pengeluaran'][$rowIndex][] = $path;
                        \Log::info("Simpan foto pengeluaran row {$rowIndex}: {$path}");
                    }
                }
            }

            // Simpan foto reimbursment dari struktur nested array: reimbursment_photos[rowIndex][fileIndex]
            foreach (($request->file('reimbursment_photos') ?? []) as $rowIndex => $files) {
                foreach ((array) $files as $file) {
                    if ($file && $file->isValid()) {
                        $path = $file->store('biaya-fotos', 'public');
                        if (!isset($storedPhotos['reimbursment'][$rowIndex])) {
                            $storedPhotos['reimbursment'][$rowIndex] = [];
                        }
                        $storedPhotos['reimbursment'][$rowIndex][] = $path;
                        \Log::info("Simpan foto reimbursment row {$rowIndex}: {$path}");
                    }
                }
            }

            \Log::info('Stored photos after processing:', $storedPhotos);

            $normalizeItems = function (?array $incoming, array $existing = [], ?array $storedPhotosByIndex = []) use ($isSuperAdmin, $userName) {
                $incoming = $incoming ?? [];
                \Log::info('normalizeItems called', [
                    'incoming_count' => is_array($incoming) ? count($incoming) : 0,
                    'stored_photos_count' => is_array($storedPhotosByIndex) ? count($storedPhotosByIndex) : 0,
                ]);
                \Log::info('normalizeItems incoming data:', $incoming);
                \Log::info('normalizeItems stored photos by index:', $storedPhotosByIndex);
                $existing = $existing ?? [];

                if ($isSuperAdmin) {
                    $result = [];
                    foreach ($incoming as $idx => $row) {
                        if (! is_array($row)) {
                            continue;
                        }

                        $nominal = (float) ($row['nominal'] ?? 0);
                        if ($nominal < 0) {
                            $nominal = 0;
                        }
                        $keterangan = trim((string) ($row['keterangan'] ?? ''));

                        $isLunas = (bool) ($row['is_lunas'] ?? false);

                        // Get atau buat 'oleh' field
                        $oleh = trim((string) ($row['oleh'] ?? ''));
                        if ($oleh === '') {
                            // Coba cari dari existing data berdasarkan index
                            if (isset($existing[$idx]['oleh'])) {
                                $oleh = $existing[$idx]['oleh'];
                            } else {
                                $oleh = $userName;
                            }
                        }

                        // Get atau buat 'created_at' field
                        $createdAt = trim((string) ($row['created_at'] ?? ''));
                        if ($createdAt === '' && isset($existing[$idx]['created_at'])) {
                            $createdAt = $existing[$idx]['created_at'];
                        }

                        if ($nominal > 0 || $keterangan !== '') {
                            $item = [
                                'nominal' => round($nominal, 2),
                                'keterangan' => $keterangan,
                                'is_lunas' => $isLunas,
                                'oleh' => $oleh,
                            ];
                            if ($createdAt !== '') {
                                $item['created_at'] = $createdAt;
                            }
                            // Log photo_paths dari input
                            \Log::info("Processing item idx {$idx}", [
                                'photo_paths_from_input' => $row['photo_paths'] ?? null,
                                'stored_photos_for_idx' => $storedPhotosByIndex[$idx] ?? null,
                            ]);
                            // Tambahkan foto jika ada (hanya untuk pengeluaran dan reimbursment)
                            $existingPhotos = isset($row['photo_paths']) && is_array($row['photo_paths']) ? $row['photo_paths'] : [];
                            if (isset($storedPhotosByIndex[$idx])) {
                                // Gabungkan foto lama dengan foto baru
                                $item['photo_paths'] = array_values(array_unique(array_merge($existingPhotos, $storedPhotosByIndex[$idx])));
                            } elseif (!empty($existingPhotos)) {
                                // Hanya gunakan foto lama
                                $item['photo_paths'] = $existingPhotos;
                            }
                            $result[] = $item;
                        }
                    }

                    return $result;
                }

                // Non–super admin: baris is_lunas tidak boleh diubah nominal / dihapus; keterangan masih boleh diubah.
                $lunasQueue = array_values(array_filter($existing, fn ($r) => is_array($r) && ! empty($r['is_lunas'])));
                $result = [];
                foreach ($incoming as $idx => $row) {
                    if (! is_array($row)) {
                        continue;
                    }

                    if (! empty($row['is_lunas'])) {
                        $lun = $lunasQueue[0] ?? null;
                        if (! $lun) {
                            throw new \InvalidArgumentException('Baris biaya lunas tidak valid atau tidak boleh ditambah.');
                        }
                        $ln = round((float) ($lun['nominal'] ?? 0), 2);
                        $lk = trim((string) ($lun['keterangan'] ?? ''));
                        $rn = round((float) ($row['nominal'] ?? 0), 2);
                        $rk = trim((string) ($row['keterangan'] ?? ''));
                        if ($ln !== $rn) {
                            throw new \InvalidArgumentException('Baris yang sudah lunas tidak boleh diubah nominalnya.');
                        }
                        array_shift($lunasQueue);
                        $item = [
                            'nominal' => $ln,
                            // Izinkan update keterangan untuk catatan koreksi/admin.
                            'keterangan' => $rk,
                            'is_lunas' => true,
                            'oleh' => $lun['oleh'] ?? $userName,
                        ];
                        if (isset($lun['created_at'])) {
                            $item['created_at'] = $lun['created_at'];
                        }
                        // Pertahankan photo_paths untuk baris yang sudah lunas
                        if (isset($lun['photo_paths'])) {
                            $item['photo_paths'] = $lun['photo_paths'];
                        }
                        $result[] = $item;

                        continue;
                    }

                    $nominal = (float) ($row['nominal'] ?? 0);
                    if ($nominal < 0) {
                        $nominal = 0;
                    }
                    $keterangan = trim((string) ($row['keterangan'] ?? ''));

                    // Get atau buat 'oleh' field
                    $oleh = trim((string) ($row['oleh'] ?? ''));
                    if ($oleh === '') {
                        $oleh = $userName;
                    }

                    if ($nominal > 0 || $keterangan !== '') {
                        $item = [
                            'nominal' => round($nominal, 2),
                            'keterangan' => $keterangan,
                            'is_lunas' => false,
                            'oleh' => $oleh,
                        ];
                        $createdAt = trim((string) ($row['created_at'] ?? ''));
                        if ($createdAt !== '') {
                            $item['created_at'] = $createdAt;
                        }
                        // Pertahankan photo_paths untuk baris yang belum lunas
                        $existingPhotos = isset($row['photo_paths']) && is_array($row['photo_paths']) ? $row['photo_paths'] : [];
                        if (!empty($existingPhotos)) {
                            $item['photo_paths'] = $existingPhotos;
                        }
                        // Gabungkan dengan foto baru jika ada
                        if (isset($storedPhotosByIndex[$idx])) {
                            $currentPhotos = $item['photo_paths'] ?? [];
                            $item['photo_paths'] = array_values(array_unique(array_merge($currentPhotos, $storedPhotosByIndex[$idx])));
                        }
                        $result[] = $item;
                    }
                }

                if (count($lunasQueue) > 0) {
                    throw new \InvalidArgumentException('Baris biaya yang sudah lunas tidak boleh dihapus.');
                }

                return $result;
            };

            if (isset($validated['biaya_jalan_items'])) {
                $updateData['biaya_jalan_items'] = $normalizeItems(
                    $validated['biaya_jalan_items'],
                    $projek->biaya_jalan_items ?? [],
                    [] // tidak ada foto
                );
                $meta['jalan'] = [
                    'by' => $userName,
                    'at' => now()->toDateTimeString(),
                ];
            }

            if (isset($validated['biaya_pengeluaran_items'])) {
                $updateData['biaya_pengeluaran_items'] = $normalizeItems(
                    $validated['biaya_pengeluaran_items'],
                    $projek->biaya_pengeluaran_items ?? [],
                    $storedPhotos['pengeluaran'] ?? []
                );
                $meta['pengeluaran'] = [
                    'by' => $userName,
                    'at' => now()->toDateTimeString(),
                ];
            }

            if (isset($validated['biaya_reimbursment_items'])) {
                $updateData['biaya_reimbursment_items'] = $normalizeItems(
                    $validated['biaya_reimbursment_items'],
                    $projek->biaya_reimbursment_items ?? [],
                    $storedPhotos['reimbursment'] ?? []
                );
                $meta['reimbursment'] = [
                    'by' => $userName,
                    'at' => now()->toDateTimeString(),
                ];
            }

            if (!empty($meta)) {
                $existingMeta = $projek->biaya_edit_meta ?? [];
                $updateData['biaya_edit_meta'] = array_merge($existingMeta, $meta);
            }

            // Log data yang akan disimpan
            \Log::info('Data yang akan disimpan:', [
                'pengeluaran_items' => $updateData['biaya_pengeluaran_items'] ?? null,
                'reimbursment_items' => $updateData['biaya_reimbursment_items'] ?? null,
            ]);

            $projek->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Biaya berhasil diupdate',
                'data' => $projek
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal update biaya: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Set project as paid (lunas)
     */
    public function setLunas(Request $request, $id)
    {
        if ((auth()->user()->role ?? null) !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya superadmin yang bisa mengubah status lunas',
            ], 403);
        }

        $projek = ProjekKerja::find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        try {
            $isLunas = filter_var($request->input('is_lunas', true), FILTER_VALIDATE_BOOLEAN);

            $projek->update([
                'is_lunas' => $isLunas,
                'lunas_at' => $isLunas ? now() : null,
            ]);

            return response()->json([
                'success' => true,
                'message' => $isLunas ? 'Project ditandai sebagai Lunas' : 'Status Lunas dibatalkan',
                'data' => $projek
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal update status lunas: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update status lunas untuk item biaya tertentu di dalam project.
     * Hanya field is_lunas yang diubah, field lain (oleh, nominal, keterangan, created_at) tetap sama.
     */
    public function updateBiayaItemLunas(Request $request, $id)
    {
        if ((auth()->user()->role ?? null) !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya superadmin yang bisa mengubah status lunas item biaya project',
            ], 403);
        }

        $projek = ProjekKerja::find($id);
        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'kategori' => 'required|in:jalan,pengeluaran,reimbursment',
            'item_index' => 'required|integer|min:0',
            'is_lunas' => 'required|boolean',
        ]);

        $fieldMap = [
            'jalan' => 'biaya_jalan_items',
            'pengeluaran' => 'biaya_pengeluaran_items',
            'reimbursment' => 'biaya_reimbursment_items',
        ];

        $field = $fieldMap[$validated['kategori']];
        $items = $projek->{$field} ?? [];
        $index = (int) $validated['item_index'];

        if (!isset($items[$index]) || !is_array($items[$index])) {
            return response()->json([
                'success' => false,
                'message' => 'Item biaya tidak ditemukan pada project ini',
            ], 404);
        }

        // Hanya update field is_lunas, semua field lain tetap sama
        // Ini untuk mencegah perubahan tidak sengaja pada field 'oleh' atau field lainnya
        $items[$index]['is_lunas'] = (bool) $validated['is_lunas'];
        $projek->{$field} = $items; // Gunakan items langsung tanpa array_values untuk menjaga index
        $projek->save();

        return response()->json([
            'success' => true,
            'message' => 'Status lunas item biaya project berhasil diupdate',
            'data' => $items[$index],
        ]);
    }

    /**
     * Export biaya to CSV
     */
    public function exportBiayaCsv($id)
    {
        $projek = ProjekKerja::find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        $fileName = 'biaya_' . $projek->id . '_' . date('YmdHis') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ];

        $callback = function() use ($projek) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Kategori', 'Nominal', 'Keterangan', 'Lunas Item']);

            // Biaya Jalan
            if ($projek->biaya_jalan_items) {
                foreach ($projek->biaya_jalan_items as $item) {
                    fputcsv($file, [
                        'Biaya Jalan',
                        $item['nominal'] ?? 0,
                        $item['keterangan'] ?? '',
                        !empty($item['is_lunas']) ? 'Ya' : 'Tidak',
                    ]);
                }
            }

            // Biaya Pengeluaran
            if ($projek->biaya_pengeluaran_items) {
                foreach ($projek->biaya_pengeluaran_items as $item) {
                    fputcsv($file, [
                        'Biaya Pengeluaran',
                        $item['nominal'] ?? 0,
                        $item['keterangan'] ?? '',
                        !empty($item['is_lunas']) ? 'Ya' : 'Tidak',
                    ]);
                }
            }

            // Biaya Reimbursment
            if ($projek->biaya_reimbursment_items) {
                foreach ($projek->biaya_reimbursment_items as $item) {
                    fputcsv($file, [
                        'Biaya Reimbursment',
                        $item['nominal'] ?? 0,
                        $item['keterangan'] ?? '',
                        !empty($item['is_lunas']) ? 'Ya' : 'Tidak',
                    ]);
                }
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get photos of a project
     */
    public function getPhotos($id)
    {
        $projek = ProjekKerja::find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'photos' => $projek->photos
        ]);
    }

    /**
     * Add photo to a project
     */
    public function addPhoto(Request $request, $id)
    {
        $projek = ProjekKerja::find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240',
            'folder_name' => 'nullable|string|max:100',
        ]);

        try {
            $targetDir = $this->buildProjectMediaPath('projek-kerja-photos', (int) $projek->id, $validated['folder_name'] ?? null);
            $path = $this->storePublicFileWithOriginalName($request->file('photo'), $targetDir);

            $photo = ProjekKerjaPhoto::create([
                'projek_kerja_id' => $projek->id,
                'photo' => $path,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Foto berhasil ditambahkan',
                'data' => $photo
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan foto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a photo
     */
    public function deletePhoto($id)
    {
        $photo = ProjekKerjaPhoto::find($id);

        if (!$photo) {
            return response()->json([
                'success' => false,
                'message' => 'Foto tidak ditemukan'
            ], 404);
        }

        try {
            if (Storage::disk('public')->exists($photo->photo)) {
                Storage::disk('public')->delete($photo->photo);
            }

            $photo->delete();

            return response()->json([
                'success' => true,
                'message' => 'Foto berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus foto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get files of a project
     */
    public function getFiles($id)
    {
        $projek = ProjekKerja::find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'files' => $projek->files
        ]);
    }

    /**
     * Get folder list for file/photo media.
     */
    public function getMediaFolders($id)
    {
        $projek = ProjekKerja::find($id);
        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        $fileRoot = 'projek-kerja-files/' . $projek->id;
        $photoRoot = 'projek-kerja-photos/' . $projek->id;

        // `exists()` tidak konsisten untuk direktori pada beberapa driver.
        // Ambil langsung daftar sub-direktori; jika root belum ada, hasilnya array kosong.
        $fileFolders = collect(Storage::disk('public')->directories($fileRoot))
            ->map(fn ($dir) => basename($dir))
            ->filter()
            ->values()
            ->all();

        $photoFolders = collect(Storage::disk('public')->directories($photoRoot))
            ->map(fn ($dir) => basename($dir))
            ->filter()
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'file_folders' => $fileFolders,
            'photo_folders' => $photoFolders,
        ]);
    }

    /**
     * Create media folder (file/photo) for a project.
     */
    public function createMediaFolder(Request $request, $id)
    {
        $projek = ProjekKerja::find($id);
        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'type' => 'required|string|in:file,photo',
            'folder_name' => 'required|string|max:100',
        ]);

        $folderName = $this->sanitizeFolderName($validated['folder_name'] ?? null);
        if (!$folderName) {
            return response()->json([
                'success' => false,
                'message' => 'Nama folder tidak valid',
            ], 422);
        }

        $baseDir = $validated['type'] === 'file' ? 'projek-kerja-files' : 'projek-kerja-photos';
        $path = $this->buildProjectMediaPath($baseDir, (int) $projek->id, $folderName);

        Storage::disk('public')->makeDirectory($path);

        return response()->json([
            'success' => true,
            'message' => 'Folder berhasil dibuat',
            'folder_name' => $folderName,
            'type' => $validated['type'],
        ]);
    }

    /**
     * Add file to a project
     */
    public function addFile(Request $request, $id)
    {
        $projek = ProjekKerja::find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Projek kerja tidak ditemukan'
            ], 404);
        }

        $validated = $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx|max:10240',
            'folder_name' => 'nullable|string|max:100',
        ]);

        try {
            $targetDir = $this->buildProjectMediaPath('projek-kerja-files', (int) $projek->id, $validated['folder_name'] ?? null);
            $path = $this->storePublicFileWithOriginalName($request->file('file'), $targetDir);

            $file = ProjekKerjaFile::create([
                'projek_kerja_id' => $projek->id,
                'file' => $path,
                'name' => $request->file('file')->getClientOriginalName(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'File berhasil ditambahkan',
                'data' => $file
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menambahkan file: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a file
     */
    public function deleteFile($id)
    {
        $file = ProjekKerjaFile::find($id);

        if (!$file) {
            return response()->json([
                'success' => false,
                'message' => 'File tidak ditemukan'
            ], 404);
        }

        try {
            if (Storage::disk('public')->exists($file->file)) {
                Storage::disk('public')->delete($file->file);
            }

            $file->delete();

            return response()->json([
                'success' => true,
                'message' => 'File berhasil dihapus'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus file: ' . $e->getMessage()
            ], 500);
        }
    }
}
