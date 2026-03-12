<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ProjekKerja;
use App\Models\ProjekKerjaPhoto;
use App\Models\ProjekKerjaFile;
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
    $projek = ProjekKerja::with(['photos','files'])
        ->latest()
        ->get();

    return response()->json($projek);
}


/* ======================================================
   GET SINGLE
====================================================== */

public function show($id)
{
    $projek = ProjekKerja::with(['photos','files'])
        ->findOrFail($id);

    return response()->json($projek);
}


/* ======================================================
   CREATE PROJECT + FILE + PHOTO
====================================================== */

public function store(Request $request)
{

    $request->validate([
        'divisi'=>'required|string',
        'jenis_pekerjaan'=>'required|string',
        'karyawan'=>'required|string',
        'alamat'=>'required|string',
        'status'=>'required|in:Proses,Selesai,Terlambat',
        'start_date'=>'required|date',
        'problem_description'=>'nullable|string',
        'file'=>'nullable|file|max:5120',
        'files.*'=>'nullable|file|max:5120',
        'photos.*'=>'nullable|image|max:2048'
    ]);

    DB::beginTransaction();

    try{

        $today = date('dmY');
        $lastId = ProjekKerja::max('id') ?? 0;
        $newNumber = $lastId + 1;

        $reportNo = "SR".
            str_pad($newNumber,3,"0",STR_PAD_LEFT).
            "/HSR/".$today;


        $projek = ProjekKerja::create([
            'report_no'=>$reportNo,
            'divisi'=>$request->divisi,
            'jenis_pekerjaan'=>$request->jenis_pekerjaan,
            'karyawan'=>$request->karyawan,
            'alamat'=>$request->alamat,
            'status'=>$request->status,
            'start_date'=>Carbon::parse($request->start_date)->format('Y-m-d'),
            'problem_description'=>$request->problem_description
        ]);


        /* ================= FILE UPLOAD ================= */

        if($request->hasFile('file')){

            $file = $request->file('file');

            $fileName = $file->getClientOriginalName();

            $path = $file->storeAs('projek-files',$fileName,'public');

            ProjekKerjaFile::create([
                'projek_kerja_id'=>$projek->id,
                'file'=>$path
            ]);

        }

        if($request->hasFile('files')){

            foreach($request->file('files') as $file){

                $fileName = $file->getClientOriginalName();

                $path = $file->storeAs('projek-files',$fileName,'public');

                ProjekKerjaFile::create([
                    'projek_kerja_id'=>$projek->id,
                    'file'=>$path
                ]);

            }

        }


        /* ================= PHOTO UPLOAD ================= */

        if($request->hasFile('photos')){

            foreach($request->file('photos') as $photo){

                $fileName = $photo->getClientOriginalName();

                $path = $photo->storeAs('projek-photos',$fileName,'public');

                ProjekKerjaPhoto::create([
                    'projek_kerja_id'=>$projek->id,
                    'photo'=>$path
                ]);

            }

        }


        DB::commit();

        return response()->json([
            'success'=>true,
            'data'=>$projek
        ],201);

    }catch(\Exception $e){

        DB::rollBack();

        return response()->json([
            'success'=>false,
            'error'=>$e->getMessage()
        ],500);

    }

}


/* ======================================================
   GET PHOTOS
====================================================== */

public function getPhotos($id)
{

    $projek = ProjekKerja::with('photos')->find($id);

    if(!$projek){
        return response()->json([
            'success'=>false
        ],404);
    }

    $photos=[];

    foreach($projek->photos as $photo){

        $photos[]=[
            'id'=>$photo->id,
            'url'=>asset('storage/'.$photo->photo)
        ];

    }

    return response()->json([
        'success'=>true,
        'photos'=>$photos
    ]);

}


/* ======================================================
   GET FILES
====================================================== */

public function getFiles($id)
{

    $projek = ProjekKerja::with('files')->find($id);

    if(!$projek){
        return response()->json([
            'success'=>false
        ],404);
    }

    $files=[];

    foreach($projek->files as $file){

        $files[]=[
            'id'=>$file->id,
            'url'=>asset('storage/'.$file->file)
        ];

    }

    return response()->json([
        'success'=>true,
        'files'=>$files
    ]);

}


/* ======================================================
   ADD PHOTO
====================================================== */

public function addPhoto(Request $request,$id)
{

    $request->validate([
        'photo'=>'required|image|max:2048'
    ]);

    $photo = $request->file('photo');

    $fileName = $photo->getClientOriginalName();

    $path = $photo->storeAs('projek-photos',$fileName,'public');

    $photo = ProjekKerjaPhoto::create([
        'projek_kerja_id'=>$id,
        'photo'=>$path
    ]);

    return response()->json([
        'success'=>true,
        'photo'=>$photo
    ]);

}


/* ======================================================
   ADD FILE
====================================================== */

public function addFile(Request $request,$id)
{

    $request->validate([
        'file'=>'required|file|max:5120'
    ]);

    $fileUpload = $request->file('file');

    $fileName = $fileUpload->getClientOriginalName();

    $path = $fileUpload->storeAs('projek-files',$fileName,'public');

    $file = ProjekKerjaFile::create([
        'projek_kerja_id'=>$id,
        'file'=>$path
    ]);

    return response()->json([
        'success'=>true,
        'file'=>$file
    ]);

}


/* ======================================================
   DELETE PHOTO
====================================================== */

public function deletePhoto($id)
{

    $photo = ProjekKerjaPhoto::findOrFail($id);

    if(Storage::disk('public')->exists($photo->photo)){
        Storage::disk('public')->delete($photo->photo);
    }

    $photo->delete();

    return response()->json([
        'success'=>true
    ]);

}


/* ======================================================
   DELETE FILE
====================================================== */

public function deleteFile($id)
{

    $file = ProjekKerjaFile::findOrFail($id);

    if(Storage::disk('public')->exists($file->file)){
        Storage::disk('public')->delete($file->file);
    }

    $file->delete();

    return response()->json([
        'success'=>true
    ]);

}


/* ======================================================
   UPDATE STATUS
====================================================== */

public function updateStatus(Request $request,$id)
{

    $request->validate([
        'status'=>'required|in:Proses,Selesai,Terlambat'
    ]);

    $projek = ProjekKerja::findOrFail($id);

    $projek->update([
        'status'=>$request->status
    ]);

    return response()->json([
        'success'=>true
    ]);

}


/* ======================================================
   UPDATE DESCRIPTION
====================================================== */

public function updateDescription(Request $request,$id)
{

    $request->validate([
        'problem_description'=>'nullable|string'
    ]);

    $projek = ProjekKerja::findOrFail($id);

    $projek->update([
        'problem_description'=>$request->problem_description
    ]);

    return response()->json([
        'success'=>true
    ]);

}


/* ======================================================
   DELETE PROJECT
====================================================== */

public function destroy($id)
{

    $projek = ProjekKerja::with(['photos','files'])->findOrFail($id);

    foreach($projek->photos as $photo){

        if(Storage::disk('public')->exists($photo->photo)){
            Storage::disk('public')->delete($photo->photo);
        }

    }

    foreach($projek->files as $file){

        if(Storage::disk('public')->exists($file->file)){
            Storage::disk('public')->delete($file->file);
        }

    }

    $projek->delete();

    return response()->json([
        'success'=>true
    ]);

}

}