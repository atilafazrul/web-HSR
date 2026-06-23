<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 40mm 28mm 25mm 28mm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11px;
            color: #000;
            line-height: 1.3;
            position: relative;
            min-height: 100%;
        }

        /* Container untuk seluruh konten dengan margin */
        .page-container {
            position: relative;
            min-height: 200mm;
            padding: 0 8mm 5mm 8mm;
        }

        table {
            border-collapse: collapse;
            table-layout: fixed;
        }

        td {
            vertical-align: top;
        }

        /* HEADER SECTION */
        .header-table {
            width: 100%;
            margin-top: 15px;
            border-bottom: 2px solid #000;
            margin-bottom: 5px;
            padding-bottom: 5px;
        }

        .header-logo {
            height: 50px;
            width: auto;
            max-width: 100%;
            object-fit: contain;
        }

        .logo-left {
            text-align: left;
            vertical-align: middle;
            padding-right: 10px;
        }

        .logo-right {
            text-align: right;
            vertical-align: middle;
        }

        .company-info {
            text-align: center;
            vertical-align: middle;
        }

        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 2px;
            letter-spacing: 1px;
        }

        .address-info {
            font-size: 10px;
            line-height: 1.3;
        }

        /* SERVICE REPORT TITLE */
        .report-title-container {
            text-align: center;
            margin-top: 5px;
            margin-bottom: 8px;
        }

        .report-title {
            font-size: 16px;
            font-weight: bold;
            text-decoration: underline;
            color: #000;
        }

        /* FORM SECTION */
        .form-table {
            width: 100%;
            border: 1px solid #000;
            margin-top: 3px;
        }

        .form-table td {
            padding: 4px 8px;
            border: 1px solid #000;
            font-size: 11px;
        }

        .label {
            font-weight: bold;
            background-color: #f5f5f5;
        }

        /* CHECKBOX TABLE STYLE */
        .checkbox-container {
            margin-top: 3px;
            width: 100%;
        }

        .checkbox-table {
            width: 100%;
        }

        .checkbox-table td {
            border: 1px solid #000;
            padding: 3px 6px;
            font-size: 10px;
            vertical-align: middle;
        }

        .checkbox-square {
            display: inline-block;
            width: 10px;
            height: 10px;
            border: 1px solid #000;
            text-align: center;
            line-height: 9px;
            margin-right: 4px;
            background: #fff;
            vertical-align: middle;
            font-weight: bold;
            font-size: 8px;
        }

        .checkbox-label {
            display: inline-block;
            vertical-align: middle;
        }

        /* SECTION HEADERS */
        .section-header {
            background-color: #e0e0e0;
            font-weight: bold;
            padding: 4px 10px;
            border: 1px solid #000;
            margin-top: 6px;
            text-transform: uppercase;
            font-size: 11px;
        }

        /* DATA TABLES */
        .data-table {
            width: 100%;
        }

        .data-table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 4px 6px;
            font-weight: bold;
            text-align: center;
            font-size: 10px;
        }

        .data-table td {
            border: 1px solid #000;
            padding: 3px 6px;
            font-size: 10px;
        }

        /* BOXES */
        .box-description {
            border: 1px solid #000;
            min-height: 20px;
            padding: 4px;
            margin-top: 3px;
            background-color: transparent;
            font-size: 10px;
            line-height: 1.15;
            word-wrap: break-word;
        }

        /* SIGNATURE SECTION */
        .signature-section {
            width: 100%;
            margin-top: 8px;
            margin-bottom: 5px;
        }

        .signature-section td {
            padding: 8px;
        }

        /* FIXED FOOTER */
        .footer-fixed {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            background: white;
            padding: 8mm 0;
            z-index: 1000;
        }

        .footer-table {
            width: 100%;
            margin: 0 auto;
            padding: 0;
            border: none;
            border-collapse: collapse;
        }

        .footer-table tr {
            border: none;
        }

        .footer-table td {
            text-align: center;
            vertical-align: middle;
            padding: 5px;
            border: none;
        }

        .footer-logo-img {
            height: 35px;
            width: auto;
            max-width: 100%;
            object-fit: contain;
        }

        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 400px;
            opacity: 0.08;
            z-index: -1;
        }

        /* Page break prevention */
        .content-section {
            page-break-inside: avoid;
        }
    </style>
</head>

<body>
    <div class="page-container">
        @if(isset($watermark) && $watermark != '')
            <img src="{{ $watermark }}" class="watermark">
        @endif

        <table class="header-table">
            <tr>
                <td width="15%" class="logo-left">
                    @if(isset($hsrLogo) && $hsrLogo != '')
                        <img src="{{ $hsrLogo }}" class="header-logo">
                    @endif
                </td>

                <td width="60%" class="company-info">
                    <div class="company-name">PT. HAYATI SEMESTA RAHARJA</div>
                    <div class="address-info">
                        Jl. Raya Pasar Kemis, Kp. Picung RT 004/005, Pasar Kemis<br>
                        Kabupaten Tangerang, Banten 15560<br>
                        Telp. 021-38962963 | HP. 08999-222-69<br>
                        Website: www.pthsr.id | Email: halo@pthsr.id
                    </div>
                </td>

                <td width="15%" class="logo-right">
                    @if(isset($isoLogo) && $isoLogo != '')
                        <img src="{{ $isoLogo }}" class="header-logo">
                    @endif
                </td>
            </tr>
        </table>

        <div class="report-title-container">
            <div class="report-title">SERVICE REPORT</div>
            <div style="font-size: 11px; margin-top: 2px;">Report No: {{ $report->report_no ?? '.................' }}
            </div>
        </div>

        <table class="form-table">
            <tr>
                <td class="label" style="width: 18%;">Customer</td>
                <td style="width: 32%;">: {{ $report->customer ?? '-' }}</td>
                <td class="label" style="width: 18%;">Contact Person</td>
                <td style="width: 32%;">: {{ $report->contact_person ?? '-' }}</td>
            </tr>
            <tr>
                <td class="label">Address</td>
                <td>: {{ $report->address ?? '-' }}</td>
                <td class="label">Phone</td>
                <td>: {{ $report->phone ?? '-' }}</td>
            </tr>
        </table>

        <div class="checkbox-container">
            @php
                $types = [
                    ['key' => 'installation', 'label' => 'Installation'],
                    ['key' => 'escalation', 'label' => 'Escalation'],
                    ['key' => 'service_contract', 'label' => 'Service Contract'],
                    ['key' => 'service', 'label' => 'Service'],
                    ['key' => 'training', 'label' => 'Training'],
                    ['key' => 'kso', 'label' => 'KSO'],
                    ['key' => 'preventive_maintenance', 'label' => 'Preventive Maintenance'],
                    ['key' => 'on_call', 'label' => 'On Call'],
                    ['key' => 'update', 'label' => 'Update'],
                    ['key' => 'warranty', 'label' => 'Warranty'],
                    ['key' => 'demo_backup', 'label' => 'Demo/Back Up']
                ];
                $selectedTypes = isset($report) ? $report->serviceTypes->pluck('type')->toArray() : [];
            @endphp

            <table class="checkbox-table">
                @foreach(array_chunk($types, 5) as $chunk)
                    <tr>
                        @foreach($chunk as $type)
                            <td>
                                <span class="checkbox-square">
                                    {{ in_array($type['key'], $selectedTypes) ? 'v' : '' }}
                                </span>
                                <span class="checkbox-label">
                                    {{ $type['label'] }}
                                </span>
                            </td>
                        @endforeach

                        @if(count($chunk) < 5)
                            @for($i = 0; $i < (5 - count($chunk)); $i++)
                                <td>&nbsp;</td>
                            @endfor
                        @endif
                    </tr>
                @endforeach
            </table>
        </div>

        <div class="section-header">Equipment Information</div>
        <table class="data-table" style="margin-top: 3px;">
            <thead>
                <tr>
                    <th width="15%">Brand</th>
                    <th width="15%">Model</th>
                    <th width="20%">Serial No.</th>
                    <th>Description</th>
                    <th width="12%">Start</th>
                    <th width="12%">Completed</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td align="center">{{ $report->brand ?? '-' }}</td>
                    <td align="center">{{ $report->model ?? '-' }}</td>
                    <td align="center">{{ $report->serial_no ?? '-' }}</td>
                    <td align="center">{{ $report->description ?? '-' }}</td>
                    <td align="center">
                        @include('pdf.partials.service_report_datetime', [
                            'date' => $report->start_date ?? null,
                            'time' => $report->start_time ?? null,
                        ])
                    </td>
                    <td align="center">
                        @include('pdf.partials.service_report_datetime', [
                            'date' => $report->completed_date ?? null,
                            'time' => $report->completed_time ?? null,
                        ])
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="section-header">Parts Replacement</div>
        <table class="data-table" style="margin-top: 3px;">
            <thead>
                <tr>
                    <th width="5%">No</th>
                    <th width="40%">Parts Name</th>
                    <th width="20%">Part No.</th>
                    <th width="10%">In</th>
                    <th width="10%">Out</th>
                    <th width="15%">Qty</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $partsCount = isset($report->parts) ? count($report->parts) : 0;
                    $minRows = max(1, min($partsCount, 2));
                @endphp
                @if($partsCount > 0)
                    @foreach($report->parts as $index => $part)
                        <tr>
                            <td align="center">{{ $index + 1 }}</td>
                            <td align="center">{{ $part->part_name }}</td>
                            <td align="center">{{ $part->part_no }}</td>
                            <td align="center">{{ $part->in }}</td>
                            <td align="center">{{ $part->out }}</td>
                            <td align="center">{{ $part->qty }}</td>
                        </tr>
                    @endforeach
                @else
                    @for($i = 1; $i <= $minRows; $i++)
                        <tr>
                            <td align="center">{{ $i }}</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                            <td>&nbsp;</td>
                        </tr>
                    @endfor
                @endif
            </tbody>
        </table>

        <div style="margin-top: 6px;">
            <strong style="font-size: 11px;">Problem Description:</strong>
            <div class="box-description">@include('pdf.partials.multiline_text', ['text' => $report->problem_description ?? ''])</div>
        </div>
        <div style="margin-top: 5px;">
            <strong style="font-size: 11px;">Service Performed:</strong>
            <div class="box-description">@include('pdf.partials.multiline_text', ['text' => $report->service_performed ?? ''])</div>
        </div>
        <div style="margin-top: 5px;">
            <strong style="font-size: 11px;">Recommendation:</strong>
            <div class="box-description">@include('pdf.partials.multiline_text', ['text' => $report->recommendation ?? ''])</div>
        </div>

        <table class="signature-section">
            <tr>
                <td width="50%" align="center">
                    <div style="margin-bottom: {{ !empty($report->ttd_teknisi) ? '8px' : '80px' }}; font-size: 11px;">
                        {{ trim($report->kota ?? '') ?: 'Tangerang' }},
                        {{ isset($report->tanggal) ? \Carbon\Carbon::parse($report->tanggal)->format('d F Y') : (isset($report->completed_date) ? \Carbon\Carbon::parse($report->completed_date)->format('d F Y') : '........................') }}
                    </div>
                    @include('pdf.partials.signature_service_report', [
                        'signature' => $report->ttd_teknisi ?? null,
                        'name' => $report->nama_teknisi ?? null,
                    ])
                </td>
                <td width="50%" align="center">
                    <div style="margin-bottom: {{ !empty($report->ttd_klien) ? '8px' : '80px' }}; font-size: 11px;">Customer</div>
                    @include('pdf.partials.signature_service_report', [
                        'signature' => $report->ttd_klien ?? null,
                        'name' => $report->nama_client ?? null,
                    ])
                </td>
            </tr>
        </table>
    </div>

    <!-- FIXED FOOTER -->
    <div class="footer-fixed">
        <table class="footer-table" border="0" cellpadding="0" cellspacing="0">
            <tr>
                <td style="width: 33.33%; text-align: center;" align="center" valign="middle">
                    @if(isset($medimageLogo) && $medimageLogo != '')
                        <img src="{{ $medimageLogo }}" class="footer-logo-img">
                    @endif
                </td>
                <td style="width: 33.33%; text-align: center;" align="center" valign="middle">
                    @if(isset($mediserLogo) && $mediserLogo != '')
                        <img src="{{ $mediserLogo }}" class="footer-logo-img">
                    @endif
                </td>
                <td style="width: 33.33%; text-align: center;" align="center" valign="middle">
                    @if(isset($mksLogo) && $mksLogo != '')
                        <img src="{{ $mksLogo }}" class="footer-logo-img">
                    @endif
                </td>
            </tr>
        </table>
    </div>

</body>

</html>