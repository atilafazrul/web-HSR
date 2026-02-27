<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\ServiceReport;
use App\Models\ServiceType;
use App\Models\ServiceReportPart;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Dompdf\Dompdf;
use Dompdf\Options;

class ServiceReportController extends Controller
{
    /**
     * Get all service reports with filtering by user/divisi
     *
     * Role Access:
     * - super_admin: Bisa lihat semua, atau filter by divisi (jika parameter divisi dikirim)
     * - admin: Hanya lihat divisi sesuai user.divisi miliknya
     * - it/service/sales/kontraktor: Hanya lihat data miliknya sendiri (by user_id)
     */
    public function index(Request $request)
    {
        $query = ServiceReport::with(['serviceTypes', 'parts', 'user']);

        $userId = $request->query('user_id');
        $userRole = $request->query('user_role');
        $userDivisi = $request->query('user_divisi'); // Divisi dari user yang login
        $divisiFilter = $request->query('divisi'); // Filter divisi untuk superadmin

        // Role-based filtering
        if ($userRole === 'super_admin') {
            // Super admin: bisa lihat semua, atau filter by divisi
            if ($divisiFilter) {
                $query->where('divisi', $divisiFilter);
            }
            // Jika tidak ada divisiFilter, superadmin lihat semua (tanpa where)
        } elseif ($userRole === 'admin') {
            // Admin: hanya lihat divisi miliknya sendiri (dari user.divisi)
            if ($userDivisi) {
                $query->where('divisi', strtoupper($userDivisi));
            } else {
                // Fallback jika admin tidak punya divisi
                $query->where('user_id', $userId);
            }
        } else {
            // Regular user (it/service/sales/kontraktor): hanya lihat data miliknya sendiri
            if ($userId) {
                $query->where('user_id', $userId);
            }
        }

        $reports = $query->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $reports
        ]);
    }

    /**
     * Get single service report
     */
    public function show($id)
    {
        $report = ServiceReport::with(['serviceTypes', 'parts', 'user'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    }

    /**
     * Store new service report
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // Customer Information
            'customer' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',

            // Equipment Information
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_no' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'completed_date' => 'nullable|date',

            // Service Details
            'problem_description' => 'nullable|string',
            'service_performed' => 'nullable|string',
            'recommendation' => 'nullable|string',

            // Administration
            'nama_teknisi' => 'required|string|max:255',
            'nama_client' => 'nullable|string|max:255',
            'kota' => 'nullable|string|max:255',
            'tanggal' => 'required|date',

            // Service Types (array)
            'checkboxes' => 'nullable|array',
            'checkboxes.*' => 'string',

            // Parts List (array of objects)
            'partsList' => 'nullable|array',
            'partsList.*.name' => 'nullable|string',
            'partsList.*.part_no' => 'nullable|string',
            'partsList.*.in' => 'nullable|string',
            'partsList.*.out' => 'nullable|string',
            'partsList.*.qty' => 'nullable|integer',

            // Meta
            'divisi' => 'required|string|max:50',
            'user_id' => 'required|integer|exists:users,id',
        ]);

        try {
            DB::beginTransaction();

            // Generate Report Number
            $reportNo = "SR" .
                str_pad(ServiceReport::count() + 1, 3, "0", STR_PAD_LEFT)
                . "/HSR/" . date('dmY');

            // Create Service Report
            $report = ServiceReport::create([
                'report_no' => $reportNo,
                'customer' => $validated['customer'],
                'contact_person' => $validated['contact_person'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'brand' => $validated['brand'] ?? null,
                'model' => $validated['model'] ?? null,
                'serial_no' => $validated['serial_no'] ?? null,
                'description' => $validated['description'] ?? null,
                'start_date' => $validated['start_date'] ?? null,
                'completed_date' => $validated['completed_date'] ?? null,
                'problem_description' => $validated['problem_description'] ?? null,
                'service_performed' => $validated['service_performed'] ?? null,
                'recommendation' => $validated['recommendation'] ?? null,
                'nama_teknisi' => $validated['nama_teknisi'],
                'nama_client' => $validated['nama_client'] ?? null,
                'kota' => $validated['kota'] ?? null,
                'tanggal' => $validated['tanggal'],
                'divisi' => $validated['divisi'],
                'status' => 'Selesai',
                'user_id' => $validated['user_id'],
            ]);

            // Save Service Types
            if (!empty($validated['checkboxes'])) {
                foreach ($validated['checkboxes'] as $type) {
                    ServiceType::create([
                        'service_report_id' => $report->id,
                        'type' => $type,
                    ]);
                }
            }

            // Save Parts List
            if (!empty($validated['partsList'])) {
                foreach ($validated['partsList'] as $part) {
                    // Only save if at least one field has value
                    if (!empty($part['name']) || !empty($part['part_no']) ||
                        !empty($part['in']) || !empty($part['out']) || !empty($part['qty'])) {
                        ServiceReportPart::create([
                            'service_report_id' => $report->id,
                            'part_name' => $part['name'] ?? null,
                            'part_no' => $part['part_no'] ?? null,
                            'in' => $part['in'] ?? null,
                            'out' => $part['out'] ?? null,
                            'qty' => $part['qty'] ?? null,
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Service Report berhasil disimpan',
                'data' => $report->load(['serviceTypes', 'parts'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan Service Report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update service report
     */
    public function update(Request $request, $id)
    {
        $report = ServiceReport::findOrFail($id);

        $validated = $request->validate([
            'customer' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'brand' => 'nullable|string|max:255',
            'model' => 'nullable|string|max:255',
            'serial_no' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'completed_date' => 'nullable|date',
            'problem_description' => 'nullable|string',
            'service_performed' => 'nullable|string',
            'recommendation' => 'nullable|string',
            'nama_teknisi' => 'required|string|max:255',
            'nama_client' => 'nullable|string|max:255',
            'kota' => 'nullable|string|max:255',
            'tanggal' => 'required|date',
        ]);

        $report->update($validated);

        return response()->json([
            'success' => true,
            'data' => $report->load(['serviceTypes', 'parts'])
        ]);
    }

    /**
     * Delete service report
     */
    public function destroy($id)
    {
        $report = ServiceReport::findOrFail($id);
        $report->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service Report berhasil dihapus'
        ]);
    }

    /**
     * Generate PDF
     */
    public function generatePDF(Request $request, $id)
    {
        $report = ServiceReport::with(['serviceTypes', 'parts', 'user'])->findOrFail($id);

        // Verify user permissions
        $userId = $request->query('user_id');
        $userRole = $request->query('user_role');

        $user = User::find($userId);

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User tidak ditemukan'], 404);
        }

        // Role-based access check
        if ($userRole === 'super_admin') {
            // Super admin can access all
        } elseif ($userRole === 'admin') {
            // Admin can only access their own divisi
            if ($report->divisi !== strtoupper($user->divisi)) {
                return response()->json(['success' => false, 'message' => 'Akses ditolak'], 403);
            }
        } else {
            // Regular user can only access their own
            if ($report->user_id != $userId) {
                return response()->json(['success' => false, 'message' => 'Akses ditolak'], 403);
            }
        }

        // Generate PDF
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);

        $dompdf = new Dompdf($options);

        // Encode logos to base64 for dompdf
        $hsrLogoPath = public_path('images/hsr logo.png');
        $isoLogoPath = public_path('images/iso logo.png');
        $medimageLogoPath = public_path('images/medimage logo.png');
        $mediserLogoPath = public_path('images/mediser logo.png');
        $mksLogoPath = public_path('images/mks logo.png');

        $hsrLogoBase64 = '';
        $isoLogoBase64 = '';
        $medimageLogoBase64 = '';
        $mediserLogoBase64 = '';
        $mksLogoBase64 = '';

        if (file_exists($hsrLogoPath)) {
            $hsrLogoData = base64_encode(file_get_contents($hsrLogoPath));
            $hsrLogoBase64 = 'data:image/png;base64,' . $hsrLogoData;
        }

        if (file_exists($isoLogoPath)) {
            $isoLogoData = base64_encode(file_get_contents($isoLogoPath));
            $isoLogoBase64 = 'data:image/png;base64,' . $isoLogoData;
        }

        if (file_exists($medimageLogoPath)) {
            $medimageLogoData = base64_encode(file_get_contents($medimageLogoPath));
            $medimageLogoBase64 = 'data:image/png;base64,' . $medimageLogoData;
        }

        if (file_exists($mediserLogoPath)) {
            $mediserLogoData = base64_encode(file_get_contents($mediserLogoPath));
            $mediserLogoBase64 = 'data:image/png;base64,' . $mediserLogoData;
        }

        if (file_exists($mksLogoPath)) {
            $mksLogoData = base64_encode(file_get_contents($mksLogoPath));
            $mksLogoBase64 = 'data:image/png;base64,' . $mksLogoData;
        }

        // Watermark
        $watermarkPath = public_path('images/LOGO HSR.png');
        $watermarkBase64 = '';

        if (file_exists($watermarkPath)) {
            $watermarkData = base64_encode(file_get_contents($watermarkPath));
            $watermarkBase64 = 'data:image/png;base64,' . $watermarkData;
        }

        $html = view('pdf.service-report', [
            'report' => $report,
            'hsrLogo' => $hsrLogoBase64,
            'isoLogo' => $isoLogoBase64,
            'medimageLogo' => $medimageLogoBase64,
            'mediserLogo' => $mediserLogoBase64,
            'mksLogo' => $mksLogoBase64,
            'watermark' => $watermarkBase64,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'ServiceReport_' . $report->report_no . '.pdf';

        return response()->make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"'
        ]);
    }
}