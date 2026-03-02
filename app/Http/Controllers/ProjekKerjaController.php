<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ProjekKerja;
use App\Models\ProjekKerjaPhoto;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProjekKerjaController extends Controller
{
    /* ======================================================
       GET ALL
    ====================================================== */
    public function index()
    {
        return response()->json(
            ProjekKerja::with('photos')->latest()->get()
        );
    }

    /* ======================================================
       GET SINGLE
    ====================================================== */
    public function show($id)
    {
        return response()->json(
            ProjekKerja::with('photos')->findOrFail($id)
        );
    }

    /* ======================================================
       GET PHOTOS
    ====================================================== */
    public function getPhotos($id)
    {
        $projek = ProjekKerja::with('photos')->find($id);

        if (!$projek) {
            return response()->json([
                'success' => false,
                'message' => 'Data tidak ditemukan'
            ], 404);
        }

        $photos = [];

        foreach ($projek->photos as $photo) {
            if ($photo->photo && Storage::disk('public')->exists($photo->photo)) {
                $photos[] = [
                    'id' => $photo->id,
                    'url' => asset('storage/' . $photo->photo)
                ];
            }
        }

        return response()->json([
            'success' => true,
            'photos' => $photos
        ]);
    }

    /* ======================================================
       CREATE PROJECT (SUPER SAFE VERSION)
    ====================================================== */
    public function store(Request $request)
    {
        $request->validate([
            'divisi' => 'required|string',
            'jenis_pekerjaan' => 'required|string',
            'karyawan' => 'required|string',
            'alamat' => 'required|string',
            'status' => 'required|in:Proses,Selesai,Terlambat',
            'start_date' => 'required|date',
            'problem_description' => 'nullable|string',

            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx|max:5120',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:2048'
        ]);

        DB::beginTransaction();

        try {

            /* ================= REPORT NUMBER SAFE ================= */
            $today = date('dmY');

            $lastId = ProjekKerja::max('id') ?? 0;
            $newNumber = $lastId + 1;

            $reportNo = "SR" .
                str_pad($newNumber, 3, "0", STR_PAD_LEFT)
                . "/HSR/" . $today;


            /* ================= UPLOAD FILE ================= */
            $filePath = null;

            if ($request->hasFile('file') && $request->file('file')->isValid()) {
                $filePath = $request->file('file')
                    ->store('projek-files', 'public');
            }


            /* ================= SAVE PROJECT ================= */
            $projek = ProjekKerja::create([
                'report_no' => $reportNo,
                'divisi' => $request->divisi,
                'jenis_pekerjaan' => $request->jenis_pekerjaan,
                'karyawan' => $request->karyawan,
                'alamat' => $request->alamat,
                'status' => $request->status,
                'start_date' => Carbon::parse($request->start_date)->format('Y-m-d'),
                'problem_description' => $request->problem_description,
                'file' => $filePath
            ]);


            /* ================= SAVE PHOTOS ================= */
            if ($request->hasFile('photos')) {
                foreach ($request->file('photos') as $photo) {
                    if ($photo->isValid()) {
                        $path = $photo->store('projek-photos', 'public');
                        $projek->photos()->create([
                            'photo' => $path
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Data berhasil disimpan',
                'data' => $projek->load('photos')
            ], 201);

        } catch (\Exception $e) {

            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /* ======================================================
       UPDATE FULL DATA
    ====================================================== */
    public function update(Request $request, $id)
    {
        $projek = ProjekKerja::findOrFail($id);

        $request->validate([
            'divisi' => 'required|string',
            'jenis_pekerjaan' => 'required|string',
            'karyawan' => 'required|string',
            'alamat' => 'required|string',
            'status' => 'required|in:Proses,Selesai,Terlambat',
            'start_date' => 'required|date',
            'problem_description' => 'nullable|string',
            'file' => 'nullable|file|mimes:pdf,doc,docx,xls,xlsx|max:5120'
        ]);

        if ($request->hasFile('file')) {
            if ($projek->file && Storage::disk('public')->exists($projek->file)) {
                Storage::disk('public')->delete($projek->file);
            }

            $projek->file = $request->file('file')
                ->store('projek-files', 'public');
        }

        $projek->update([
            'divisi' => $request->divisi,
            'jenis_pekerjaan' => $request->jenis_pekerjaan,
            'karyawan' => $request->karyawan,
            'alamat' => $request->alamat,
            'status' => $request->status,
            'start_date' => Carbon::parse($request->start_date)->format('Y-m-d'),
            'problem_description' => $request->problem_description
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diupdate',
            'data' => $projek->load('photos')
        ]);
    }

    /* ======================================================
       UPDATE STATUS
    ====================================================== */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Proses,Selesai,Terlambat'
        ]);

        $projek = ProjekKerja::findOrFail($id);

        $projek->update([
            'status' => $request->status
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status berhasil diupdate'
        ]);
    }

    /* ======================================================
       UPDATE DESCRIPTION
    ====================================================== */
    public function updateDescription(Request $request, $id)
    {
        $request->validate([
            'problem_description' => 'nullable|string'
        ]);

        $projek = ProjekKerja::findOrFail($id);

        $projek->update([
            'problem_description' => $request->problem_description
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Deskripsi berhasil diupdate'
        ]);
    }

    /* ======================================================
       DELETE PROJECT
    ====================================================== */
    public function destroy($id)
    {
        $projek = ProjekKerja::with('photos')->findOrFail($id);

        if ($projek->file && Storage::disk('public')->exists($projek->file)) {
            Storage::disk('public')->delete($projek->file);
        }

        foreach ($projek->photos as $photo) {
            if ($photo->photo && Storage::disk('public')->exists($photo->photo)) {
                Storage::disk('public')->delete($photo->photo);
            }
        }

        $projek->delete();

        return response()->json([
            'success' => true,
            'message' => 'Project berhasil dihapus'
        ]);
    }
}