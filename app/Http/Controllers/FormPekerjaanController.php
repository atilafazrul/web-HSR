<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use setasign\Fpdi\Fpdi;

class FormPekerjaanController extends Controller
{
    public function generatePdf(Request $request)
    {
        $template = storage_path('app/templates/form-servis.pdf');

        if (!file_exists($template)) {
            return response()->json(['error'=>'Template not found'],500);
        }

        $pdf = new Fpdi();

        $pdf->AddPage();
        $pdf->setSourceFile($template);

        $tpl = $pdf->importPage(1);
        $pdf->useTemplate($tpl);

        $pdf->SetFont('Arial','',9);


        /* ================= HEADER ================= */

        $pdf->SetXY(35,39);
        $pdf->Write(10,$request->report_no);

        $pdf->SetXY(35,44);
        $pdf->Write(10,$request->customer);

        $pdf->SetXY(138,44);
        $pdf->Write(10,$request->contact_person);

        $pdf->SetXY(35,49);
        $pdf->Write(10,$request->address);

        $pdf->SetXY(138,49);
        $pdf->Write(10,$request->phone);


        /* ================= MACHINE ================= */

        $pdf->SetXY(21,72);
        $pdf->Write(10,$request->brand);

        $pdf->SetXY(47,72);
        $pdf->Write(10,$request->model);

        $pdf->SetXY(80,72);
        $pdf->Write(10,$request->serial_no);

        $pdf->SetXY(103,72);
        $pdf->Write(10,$request->description);

        $pdf->SetXY(147,72);
        $pdf->Write(10,$request->start_date);

        $pdf->SetXY(175,72);
        $pdf->Write(10,$request->completed_date);


        /* ================= TEXT AREA ================= */

        $pdf->SetXY(20,128);
        $pdf->MultiCell(170,4,$request->problem);

        $pdf->SetXY(20,153);
        $pdf->MultiCell(170,6,$request->service_performed);

        $pdf->SetXY(20,205);
        $pdf->MultiCell(165,6,$request->recommendation);


        return response($pdf->Output('S'))
            ->header('Content-Type','application/pdf');
    }
}