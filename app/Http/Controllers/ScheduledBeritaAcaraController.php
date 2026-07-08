<?php

namespace App\Http\Controllers;

use App\Models\ProjekKerja;
use App\Models\ScheduledBeritaAcaraDocument;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ScheduledBeritaAcaraController extends Controller
{
    public function index(Request $request)
    {
        $query = ScheduledBeritaAcaraDocument::query()
            ->with(['projekKerja:id,jenis_pekerjaan', 'creator:id,name'])
            ->orderByDesc('scheduled_at');

        if ($request->filled('projek_kerja_id')) {
            $query->where('projek_kerja_id', $request->integer('projek_kerja_id'));
        }

        if ($request->filled('document_type')) {
            $query->where('document_type', $request->string('document_type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return response()->json([
            'data' => $query->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'projek_kerja_id' => 'required|exists:projek_kerjas,id',
            'document_type' => ['required', Rule::in([
                ScheduledBeritaAcaraDocument::TYPE_BAST,
                ScheduledBeritaAcaraDocument::TYPE_BAUF,
                ScheduledBeritaAcaraDocument::TYPE_BAM,
                ScheduledBeritaAcaraDocument::TYPE_SPH,
                ScheduledBeritaAcaraDocument::TYPE_SPPD,
            ])],
            'scheduled_at' => 'required|date|after:now',
            'form_payload' => 'required|array',
        ]);

        $this->validateFormPayload($validated['document_type'], $validated['form_payload']);

        ProjekKerja::findOrFail($validated['projek_kerja_id']);

        $schedule = ScheduledBeritaAcaraDocument::create([
            'projek_kerja_id' => $validated['projek_kerja_id'],
            'created_by' => $request->user()?->id,
            'document_type' => $validated['document_type'],
            'form_payload' => $validated['form_payload'],
            'scheduled_at' => $validated['scheduled_at'],
            'status' => ScheduledBeritaAcaraDocument::STATUS_PENDING,
        ]);

        $schedule->load(['projekKerja:id,jenis_pekerjaan', 'creator:id,name']);

        return response()->json([
            'message' => 'Jadwal generate berhasil disimpan.',
            'data' => $schedule,
        ], 201);
    }

    public function destroy(int $id)
    {
        $schedule = ScheduledBeritaAcaraDocument::findOrFail($id);

        if ($schedule->status !== ScheduledBeritaAcaraDocument::STATUS_PENDING) {
            return response()->json([
                'message' => 'Hanya jadwal yang masih menunggu yang bisa dibatalkan.',
            ], 422);
        }

        $schedule->delete();

        return response()->json([
            'message' => 'Jadwal generate berhasil dibatalkan.',
        ]);
    }

    private function validateFormPayload(string $documentType, array $payload): void
    {
        $rules = match ($documentType) {
            ScheduledBeritaAcaraDocument::TYPE_BAST => [
                'nama_hari' => 'required|string',
                'tanggal_bast' => 'required|string',
                'nama_klient' => 'required|string',
                'tanggal_tanda_tangan' => 'required|string',
                'kota_tanda_tangan' => 'nullable|string|max:100',
                'ttd_hsr' => 'nullable|string|max:500000',
                'ttd_klien' => 'nullable|string|max:500000',
                'nama_ttd_hsr' => 'nullable|string|max:150',
                'nama_ttd_klien' => 'nullable|string|max:150',
                'hasil' => 'required|string',
                'items' => 'required|array|min:1',
                'items.*.nama_alat' => 'required|string',
                'items.*.merk' => 'required|string',
                'items.*.jumlah' => 'required|string',
            ],
            ScheduledBeritaAcaraDocument::TYPE_BAUF => [
                'nama_hari' => 'required|string',
                'tanggal_bauf' => 'required|string',
                'nama_klient' => 'required|string',
                'tanggal_tanda_tangan' => 'required|string',
                'kota_tanda_tangan' => 'nullable|string|max:100',
                'ttd_hsr' => 'nullable|string|max:500000',
                'ttd_klien' => 'nullable|string|max:500000',
                'nama_ttd_hsr' => 'nullable|string|max:150',
                'nama_ttd_klien' => 'nullable|string|max:150',
                'hasil' => 'required|string',
                'items' => 'required|array|min:1',
                'items.*.nama_alat' => 'required|string',
                'items.*.merk' => 'required|string',
                'items.*.jumlah' => 'required|string',
            ],
            ScheduledBeritaAcaraDocument::TYPE_BAM => [
                'nama_hari' => 'required|string',
                'tanggal_bam' => 'required|string',
                'nama_klient' => 'required|string',
                'tanggal_tanda_tangan' => 'required|string',
                'ttd_hsr' => 'nullable|string|max:500000',
                'ttd_klien' => 'nullable|string|max:500000',
                'nama_ttd_hsr' => 'nullable|string|max:150',
                'nama_ttd_klien' => 'nullable|string|max:150',
                'hasil' => 'required|string',
                'items' => 'required|array|min:1',
                'items.*.nama_alat' => 'required|string',
                'items.*.merk' => 'required|string',
                'items.*.jumlah' => 'required|string',
            ],
            ScheduledBeritaAcaraDocument::TYPE_SPH => [
                'lampiran' => 'nullable|string|max:100',
                'perihal' => 'nullable|string|max:200',
                'penerima_nama' => 'required|string|max:255',
                'paragraf_pembuka' => 'nullable|string|max:50000',
                'items' => 'required|array|min:1',
                'items.*.nama_item' => 'required|string',
                'items.*.deskripsi' => 'nullable|string',
                'items.*.qty' => 'required|string',
                'items.*.harga' => 'required|numeric|min:0',
                'kota_tanda_tangan' => 'nullable|string|max:100',
                'tanggal_tanda_tangan' => 'required|string',
                'nama_penandatangan' => 'nullable|string|max:150',
                'jabatan_penandatangan' => 'nullable|string|max:150',
                'syarat_ketentuan' => 'nullable|string|max:50000',
                'paragraf_penutup' => 'nullable|string|max:50000',
            ],
            ScheduledBeritaAcaraDocument::TYPE_SPPD => [
                'pejabat_perintah' => 'required|string',
                'nama_pegawai' => 'required|string',
                'jabatan' => 'required|string',
                'tempat_berangkat' => 'required|string',
                'tempat_tujuan' => 'required|string',
                'transportasi' => 'required|string',
                'tanggal_berangkat' => 'required|string',
                'tanggal_kembali' => 'required|string',
                'maksud' => 'required|string',
                'pengikut_nama' => 'nullable|string',
                'atas_beban' => 'required|string',
                'keterangan' => 'nullable|string',
                'dibuat_oleh' => 'required|string',
                'tanggal_tanda_tangan' => 'required|string',
                'approve_nama' => 'required|string',
                'approve_jabatan' => 'nullable|string',
                'ttd_dibuat_oleh' => 'nullable|string|max:500000',
                'ttd_menyetujui' => 'nullable|string|max:500000',
            ],
            default => [],
        };

        validator($payload, $rules)->validate();
    }
}
