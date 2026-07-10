<?php

namespace App\Http\Controllers;

use App\Models\CutiRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\CutiNotificationService;

class CutiController extends Controller
{
    /* ============================================================
     * HELPERS
     * ============================================================ */

    private function isSuperAdmin($user): bool
    {
        return $user && $user->role === 'super_admin';
    }

    private function transform(CutiRequest $cuti): array
    {
        return [
            'id'                 => $cuti->id,
            'user_id'            => $cuti->user_id,
            'nama_pengaju'       => $cuti->nama_pengaju ?? optional($cuti->user)->name,
            'divisi_pengaju'     => $cuti->divisi_pengaju ?? optional($cuti->user)->divisi,
            'role_pengaju'       => $cuti->role_pengaju   ?? optional($cuti->user)->role,
            'jenis_cuti'         => $cuti->jenis_cuti,
            'tanggal_mulai'      => optional($cuti->tanggal_mulai)->format('Y-m-d'),
            'tanggal_selesai'    => optional($cuti->tanggal_selesai)->format('Y-m-d'),
            'jumlah_hari'        => (int) $cuti->jumlah_hari,
            'alasan'             => $cuti->alasan,
            'lampiran'           => $cuti->lampiran,
            'lampiran_url'       => $cuti->lampiran_url,
            'status'             => $cuti->status,
            'approved_by'        => $cuti->approved_by,
            'approved_by_nama'   => $cuti->approved_by_nama ?? optional($cuti->approver)->name,
            'approved_at'        => optional($cuti->approved_at)->toIso8601String(),
            'alasan_penolakan'   => $cuti->alasan_penolakan,
            'created_at'         => $cuti->created_at?->toIso8601String(),
            'updated_at'         => $cuti->updated_at?->toIso8601String(),
        ];
    }

    /* ============================================================
     * INDEX – list cuti
     * Super Admin: semua data
     * Lainnya    : hanya milik sendiri
     * Query param: ?status=pending|approved|rejected (opsional)
     * ============================================================ */
    public function index(Request $request)
    {
        $user = $request->user();

        $query = CutiRequest::query()
            ->with(['user:id,name,divisi,role,profile_photo', 'approver:id,name'])
            ->orderByDesc('created_at');

        if (!$this->isSuperAdmin($user)) {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $data = $query->get()->map(fn ($c) => $this->transform($c));

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    /* ============================================================
     * SHOW – detail cuti
     * ============================================================ */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        $cuti = CutiRequest::with(['user', 'approver'])->find($id);

        if (!$cuti) {
            return response()->json(['success' => false, 'message' => 'Data cuti tidak ditemukan'], 404);
        }

        if (!$this->isSuperAdmin($user) && (int) $cuti->user_id !== (int) $user->id) {
            return response()->json(['success' => false, 'message' => 'Anda tidak berhak melihat data ini'], 403);
        }

        return response()->json([
            'success' => true,
            'data'    => $this->transform($cuti),
        ]);
    }

    /* ============================================================
     * STORE – ajukan cuti baru
     * ============================================================ */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'jenis_cuti'      => 'required|in:Cuti Tahunan,Cuti Sakit,Cuti Melahirkan,Cuti Menikah,Cuti Penting,Cuti Lainnya',
            'tanggal_mulai'   => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'alasan'          => 'required|string|max:2000',
            'lampiran'        => 'nullable|file|max:5120|mimes:jpg,jpeg,png,pdf,doc,docx',
        ]);

        $start = Carbon::parse($validated['tanggal_mulai'])->startOfDay();
        $end   = Carbon::parse($validated['tanggal_selesai'])->startOfDay();
        $jumlahHari = $start->diffInDays($end) + 1;

        $lampiranPath = null;
        if ($request->hasFile('lampiran')) {
            $lampiranPath = $request->file('lampiran')->store('cuti-lampiran', 'public');
        }

        $cuti = CutiRequest::create([
            'user_id'         => $user->id,
            'nama_pengaju'    => $user->name,
            'divisi_pengaju'  => $user->divisi,
            'role_pengaju'    => $user->role,
            'jenis_cuti'      => $validated['jenis_cuti'],
            'tanggal_mulai'   => $start->toDateString(),
            'tanggal_selesai' => $end->toDateString(),
            'jumlah_hari'     => $jumlahHari,
            'alasan'          => $validated['alasan'],
            'lampiran'        => $lampiranPath,
            'status'          => 'pending',
        ]);

        $cuti->load(['user', 'approver']);

        app(CutiNotificationService::class)->notifyNewSubmission($cuti);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan cuti berhasil dikirim',
            'data'    => $this->transform($cuti),
        ], 201);
    }

    /* ============================================================
     * UPDATE – edit cuti (hanya pemilik & status = pending)
     * ============================================================ */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $cuti = CutiRequest::find($id);

        if (!$cuti) {
            return response()->json(['success' => false, 'message' => 'Data cuti tidak ditemukan'], 404);
        }

        if ((int) $cuti->user_id !== (int) $user->id) {
            return response()->json(['success' => false, 'message' => 'Anda tidak berhak mengubah data ini'], 403);
        }

        if ($cuti->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan yang sudah diproses tidak bisa diubah',
            ], 422);
        }

        $validated = $request->validate([
            'jenis_cuti'      => 'sometimes|in:Cuti Tahunan,Cuti Sakit,Cuti Melahirkan,Cuti Menikah,Cuti Penting,Cuti Lainnya',
            'tanggal_mulai'   => 'sometimes|date',
            'tanggal_selesai' => 'sometimes|date|after_or_equal:tanggal_mulai',
            'alasan'          => 'sometimes|string|max:2000',
            'lampiran'        => 'nullable|file|max:5120|mimes:jpg,jpeg,png,pdf,doc,docx',
            'hapus_lampiran'  => 'nullable|boolean',
        ]);

        if (array_key_exists('jenis_cuti', $validated))      $cuti->jenis_cuti = $validated['jenis_cuti'];
        if (array_key_exists('alasan', $validated))          $cuti->alasan     = $validated['alasan'];

        if (array_key_exists('tanggal_mulai', $validated))   $cuti->tanggal_mulai   = $validated['tanggal_mulai'];
        if (array_key_exists('tanggal_selesai', $validated)) $cuti->tanggal_selesai = $validated['tanggal_selesai'];

        $start = Carbon::parse($cuti->tanggal_mulai)->startOfDay();
        $end   = Carbon::parse($cuti->tanggal_selesai)->startOfDay();
        $cuti->jumlah_hari = $start->diffInDays($end) + 1;

        // Hapus lampiran lama jika diminta
        if ($request->boolean('hapus_lampiran') && $cuti->lampiran) {
            if (Storage::disk('public')->exists($cuti->lampiran)) {
                Storage::disk('public')->delete($cuti->lampiran);
            }
            $cuti->lampiran = null;
        }

        // Replace lampiran jika ada upload baru
        if ($request->hasFile('lampiran')) {
            if ($cuti->lampiran && Storage::disk('public')->exists($cuti->lampiran)) {
                Storage::disk('public')->delete($cuti->lampiran);
            }
            $cuti->lampiran = $request->file('lampiran')->store('cuti-lampiran', 'public');
        }

        $cuti->save();
        $cuti->load(['user', 'approver']);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan cuti berhasil diperbarui',
            'data'    => $this->transform($cuti),
        ]);
    }

    /* ============================================================
     * APPROVE – super admin saja
     * ============================================================ */
    public function approve(Request $request, $id)
    {
        $user = $request->user();

        if (!$this->isSuperAdmin($user)) {
            return response()->json(['success' => false, 'message' => 'Hanya super admin yang dapat menyetujui cuti'], 403);
        }

        $cuti = CutiRequest::find($id);

        if (!$cuti) {
            return response()->json(['success' => false, 'message' => 'Data cuti tidak ditemukan'], 404);
        }

        if ($cuti->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Pengajuan ini sudah diproses sebelumnya'], 422);
        }

        $cuti->status            = 'approved';
        $cuti->approved_by       = $user->id;
        $cuti->approved_by_nama  = $user->name;
        $cuti->approved_at       = now();
        $cuti->alasan_penolakan  = null;
        $cuti->save();

        $cuti->load(['user', 'approver']);

        app(CutiNotificationService::class)->notifyApproved($cuti, $user);

        return response()->json([
            'success' => true,
            'message' => 'Cuti berhasil disetujui',
            'data'    => $this->transform($cuti),
        ]);
    }

    /* ============================================================
     * REJECT – super admin saja, butuh alasan
     * ============================================================ */
    public function reject(Request $request, $id)
    {
        $user = $request->user();

        if (!$this->isSuperAdmin($user)) {
            return response()->json(['success' => false, 'message' => 'Hanya super admin yang dapat menolak cuti'], 403);
        }

        $validated = $request->validate([
            'alasan_penolakan' => 'required|string|max:1000',
        ]);

        $cuti = CutiRequest::find($id);

        if (!$cuti) {
            return response()->json(['success' => false, 'message' => 'Data cuti tidak ditemukan'], 404);
        }

        if ($cuti->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Pengajuan ini sudah diproses sebelumnya'], 422);
        }

        $cuti->status            = 'rejected';
        $cuti->approved_by       = $user->id;
        $cuti->approved_by_nama  = $user->name;
        $cuti->approved_at       = now();
        $cuti->alasan_penolakan  = $validated['alasan_penolakan'];
        $cuti->save();

        $cuti->load(['user', 'approver']);

        app(CutiNotificationService::class)->notifyRejected($cuti, $user);

        return response()->json([
            'success' => true,
            'message' => 'Cuti telah ditolak',
            'data'    => $this->transform($cuti),
        ]);
    }

    /* ============================================================
     * DESTROY – hapus pengajuan
     * Pemilik bisa hapus jika status = pending
     * Super admin bisa hapus apapun
     * ============================================================ */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $cuti = CutiRequest::find($id);

        if (!$cuti) {
            return response()->json(['success' => false, 'message' => 'Data cuti tidak ditemukan'], 404);
        }

        $isOwner = (int) $cuti->user_id === (int) $user->id;
        $isSuper = $this->isSuperAdmin($user);

        if (!$isSuper && !$isOwner) {
            return response()->json(['success' => false, 'message' => 'Anda tidak berhak menghapus data ini'], 403);
        }

        if ($isOwner && !$isSuper && $cuti->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Pengajuan yang sudah diproses tidak bisa dihapus',
            ], 422);
        }

        if ($cuti->lampiran && Storage::disk('public')->exists($cuti->lampiran)) {
            Storage::disk('public')->delete($cuti->lampiran);
        }

        $cuti->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan cuti berhasil dihapus',
        ]);
    }

    /* ============================================================
     * SUMMARY – statistik kecil untuk dashboard widget
     * ============================================================ */
    public function summary(Request $request)
    {
        $user = $request->user();

        $base = CutiRequest::query();
        if (!$this->isSuperAdmin($user)) {
            $base->where('user_id', $user->id);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total'    => (clone $base)->count(),
                'pending'  => (clone $base)->where('status', 'pending')->count(),
                'approved' => (clone $base)->where('status', 'approved')->count(),
                'rejected' => (clone $base)->where('status', 'rejected')->count(),
            ],
        ]);
    }
}
