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
    protected function resolveDefaultPicFromDivisi(?string $targetDivisi): ?string
    {
        $target = strtolower(trim((string) $targetDivisi));
        if ($target === '') {
            return null;
        }

        $user = User::query()
            ->whereRaw('LOWER(divisi) = ?', [$target])
            ->where('role', '!=', 'super_admin')
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

        if (empty($names)) {
            return $fallback ?: null;
        }

        $target = strtolower(trim((string) $targetDivisi));
        if ($target === '') {
            return end($names) ?: ($fallback ?: null);
        }

        $users = User::query()
            ->whereRaw('LOWER(divisi) = ?', [$target])
            ->pluck('name')
            ->map(fn ($n) => strtolower(trim((string) $n)))
            ->filter()
            ->values()
            ->all();
        $nameSet = array_fill_keys($users, true);

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

        return end($names) ?: ($fallback ?: null);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = ProjekKerja::query();

        // Filter by divisi if provided
        // Juga tampilkan projek yang pernah lewat divisi ini (ada di divisi_flow)
        if ($request->has('divisi') && $request->divisi) {
            $divisiFilter = strtolower($request->divisi);
            $query->where(function($q) use ($divisiFilter) {
                $q->where('divisi', $divisiFilter)
                  ->orWhere('divisi_flow', 'like', '%' . $divisiFilter . '%');
            });
        }

        $projek = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $projek
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'divisi' => 'required|string',
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
        ]);

        DB::beginTransaction();
        try {
            // Generate report_no automatically - Format: SRXXX/HSR/YYMMDD
            $lastProject = ProjekKerja::orderBy('id', 'desc')->first();
            $lastId = $lastProject ? $lastProject->id : 0;
            $newId = $lastId + 1;
            $reportNo = 'SR' . str_pad($newId, 3, '0', STR_PAD_LEFT) . '/HSR/' . date('ymd');

            // created_by_divisi harus selalu divisi dari user yang membuat (authenticated user's divisi)
            // Ini menunjukkan siapa yang AWAL membuat projek tersebut
            $createdByDivisi = auth()->user()->divisi ?? 'Sales';

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
                'divisi_flow' => $divisiFlow,
                'pic_karyawan' => $picKaryawan,
                'karyawan_terlibat' => $karyawanTerlibat,
                'status_history' => [
                    [
                        'status' => $validated['status'],
                        'updated_at' => now()->toDateTimeString(),
                        'updated_by' => auth()->user()->name ?? 'System',
                    ]
                ],
            ];

            $projek = ProjekKerja::create($data);

            // Handle file upload
            if ($request->hasFile('file')) {
                $path = $request->file('file')->store('projek-kerja-files', 'public');
                $projek->update(['file_url' => asset('storage/' . $path)]);
                // Simpan juga ke tabel dokumentasi supaya langsung muncul di halaman Foto/Dokumen Projek.
                ProjekKerjaFile::create([
                    'projek_kerja_id' => $projek->id,
                    'file' => $path,
                ]);
            }

            // Handle photo uploads
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $photo) {
                    $photoPath = $photo->store('projek-kerja-photos', 'public');
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
                'status_history' => $history
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
            'biaya_pengeluaran_items' => 'nullable|array',
            'biaya_pengeluaran_items.*.nominal' => 'nullable|numeric|min:0',
            'biaya_pengeluaran_items.*.keterangan' => 'nullable|string',
            'biaya_pengeluaran_items.*.is_lunas' => 'nullable|boolean',
            'biaya_reimbursment_items' => 'nullable|array',
            'biaya_reimbursment_items.*.nominal' => 'nullable|numeric|min:0',
            'biaya_reimbursment_items.*.keterangan' => 'nullable|string',
            'biaya_reimbursment_items.*.is_lunas' => 'nullable|boolean',
        ]);

        try {
            $updateData = [];
            $meta = [];
            $userName = auth()->user()->name ?? 'System';
            $isSuperAdmin = (auth()->user()->role ?? null) === 'super_admin';

            $normalizeItems = function (?array $incoming, array $existing = []) use ($isSuperAdmin) {
                $incoming = $incoming ?? [];
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

                        if ($nominal > 0 || $keterangan !== '') {
                            $result[] = [
                                'nominal' => round($nominal, 2),
                                'keterangan' => $keterangan,
                                'is_lunas' => $isLunas,
                            ];
                        }
                    }

                    return $result;
                }

                // Non–super admin: baris is_lunas tidak boleh diubah isi / dihapus; urutan baris lunas harus sama.
                $lunasQueue = array_values(array_filter($existing, fn ($r) => is_array($r) && ! empty($r['is_lunas'])));
                $result = [];
                foreach ($incoming as $row) {
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
                        if ($ln !== $rn || $lk !== $rk) {
                            throw new \InvalidArgumentException('Baris yang sudah lunas tidak boleh diubah nominal atau keterangannya.');
                        }
                        array_shift($lunasQueue);
                        $result[] = [
                            'nominal' => $ln,
                            'keterangan' => $lk,
                            'is_lunas' => true,
                        ];

                        continue;
                    }

                    $nominal = (float) ($row['nominal'] ?? 0);
                    if ($nominal < 0) {
                        $nominal = 0;
                    }
                    $keterangan = trim((string) ($row['keterangan'] ?? ''));

                    if ($nominal > 0 || $keterangan !== '') {
                        $result[] = [
                            'nominal' => round($nominal, 2),
                            'keterangan' => $keterangan,
                            'is_lunas' => false,
                        ];
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
                    $projek->biaya_jalan_items ?? []
                );
                $meta['jalan'] = [
                    'by' => $userName,
                    'at' => now()->toDateTimeString(),
                ];
            }

            if (isset($validated['biaya_pengeluaran_items'])) {
                $updateData['biaya_pengeluaran_items'] = $normalizeItems(
                    $validated['biaya_pengeluaran_items'],
                    $projek->biaya_pengeluaran_items ?? []
                );
                $meta['pengeluaran'] = [
                    'by' => $userName,
                    'at' => now()->toDateTimeString(),
                ];
            }

            if (isset($validated['biaya_reimbursment_items'])) {
                $updateData['biaya_reimbursment_items'] = $normalizeItems(
                    $validated['biaya_reimbursment_items'],
                    $projek->biaya_reimbursment_items ?? []
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
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240'
        ]);

        try {
            $path = $request->file('photo')->store('projek-kerja-photos', 'public');

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
            'file' => 'required|file|mimes:pdf,doc,docx,xls,xlsx|max:10240'
        ]);

        try {
            $path = $request->file('file')->store('projek-kerja-files', 'public');

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
