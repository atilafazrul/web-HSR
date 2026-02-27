<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 10mm 10mm 5mm 10mm;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12px;
            color: #000;
            line-height: 1.3;
            position: relative;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
        }

        td {
            vertical-align: top;
        }

        /* HEADER SECTION */
        .header-table {
            border-bottom: 2px solid #000;
            margin-bottom: 5px;
            padding-bottom: 10px;
        }

        .header-logo {
            height: 75px;
            width: auto;
            max-width: 100%;
            object-fit: contain;
        }

        .logo-left {
            text-align: left;
            vertical-align: middle;
            padding-right: 15px;
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
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 4px;
            letter-spacing: 1px;
        }

        .address-info {
            font-size: 11px;
            line-height: 1.4;
        }

        /* SERVICE REPORT TITLE */
        .report-title-container {
            text-align: center;
            margin-top: 10px;
            margin-bottom: 15px;
        }

        .report-title {
            font-size: 18px;
            font-weight: bold;
            text-decoration: underline;
            color: #000;
        }

        /* FORM SECTION */
        .form-table {
            border: 1px solid #000;
            margin-top: 5px;
        }

        .form-table td {
            padding: 7px 5px;
            border: 1px solid #000;
        }

        .label {
            font-weight: bold;
            background-color: #f5f5f5;
        }

        /* CHECKBOX TABLE STYLE */
        .checkbox-container {
            margin-top: 5px;
            width: 100%;
        }

        .checkbox-table td {
            border: 1px solid #000;
            padding: 8px 5px;
            font-size: 11px;
            vertical-align: middle;
        }

        .checkbox-square {
            display: inline-block;
            width: 13px;
            height: 13px;
            border: 1px solid #000;
            text-align: center;
            line-height: 12px;
            margin-right: 6px;
            background: #fff;
            vertical-align: middle;
            font-weight: bold;
        }

        .checkbox-label {
            display: inline-block;
            vertical-align: middle;
        }

        /* SECTION HEADERS */
        .section-header {
            background-color: #e0e0e0;
            font-weight: bold;
            padding: 6px 10px;
            border: 1px solid #000;
            margin-top: 12px;
            text-transform: uppercase;
            font-size: 13px;
        }

        /* DATA TABLES */
        .data-table th {
            background-color: #f0f0f0;
            border: 1px solid #000;
            padding: 6px;
            font-weight: bold;
            text-align: center;
            font-size: 11px;
        }

        .data-table td {
            border: 1px solid #000;
            padding: 6px;
            font-size: 11px;
        }

        /* BOXES */
        .box-description {
            border: 1px solid #000;
            min-height: 50px;
            padding: 8px;
            margin-top: 4px;
            background-color: transparent;
            font-size: 11px;
        }

        /* SIGNATURE & FOOTER */
        .signature-section {
            margin-top: 15px;
        }

        .footer-table {
            width: 100%;
            margin-top: 20px;
            padding-top: 5px;
        }

        .footer-logo-img {
            height: 40px;
            width: auto;
            object-fit: contain;
        }

        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            opacity: 0.08;
            z-index: -1;
        }
    </style>
</head>

<body>
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
        <div style="font-size: 12px; margin-top: 3px;">Report No: {{ $report->report_no ?? '.................' }}</div>
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
    <table class="data-table" style="margin-top: 5px;">
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
                    {{ isset($report->start_date) ? \Carbon\Carbon::parse($report->start_date)->format('d-m-Y') : '-' }}
                </td>
                <td align="center">
                    {{ isset($report->completed_date) ? \Carbon\Carbon::parse($report->completed_date)->format('d-m-Y') : '-' }}
                </td>
            </tr>
        </tbody>
    </table>

    <div class="section-header">Parts Replacement</div>
    <table class="data-table" style="margin-top: 5px;">
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
            @if(isset($report->parts) && count($report->parts) > 0)
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
                @for($i = 1; $i <= 3; $i++)
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

    <div style="margin-top: 15px;">
        <strong>Problem Description:</strong>
        <div class="box-description">{{ $report->problem_description ?? '' }}</div>
    </div>
    <div style="margin-top: 10px;">
        <strong>Service Performed:</strong>
        <div class="box-description">{{ $report->service_performed ?? '' }}</div>
    </div>
    <div style="margin-top: 10px;">
        <strong>Recommendation:</strong>
        <div class="box-description">{{ $report->recommendation ?? '' }}</div>
    </div>

    <table class="signature-section">
        <tr>
            <td width="50%" align="center" style="padding: 10px;">
                <div style="margin-bottom: 70px;">
                    Tangerang,
                    {{ isset($report->completed_date) ? \Carbon\Carbon::parse($report->completed_date)->format('d F Y') : '........................' }}
                </div>
                <div style="border-top: 1px solid #000; padding-top: 5px; min-width: 200px; display: inline-block;">
                    ( {{ $report->nama_teknisi ?? '........................' }} )
                </div>
            </td>
            <td width="50%" align="center" style="padding: 10px;">
                <div style="margin-bottom: 70px;">Customer (Sign & Stamp)</div>
                <div style="border-top: 1px solid #000; padding-top: 5px; min-width: 200px; display: inline-block;">
                    ( {{ $report->nama_client ?? '........................' }} )
                </div>
            </td>
        </tr>
    </table>

    <table class="footer-table">
        <tr>
            <td align="center" width="33.3%">
                @if(isset($medimageLogo) && $medimageLogo != '')
                    <img src="{{ $medimageLogo }}" class="footer-logo-img">
                @endif
            </td>
            <td align="center" width="33.3%">
                @if(isset($mediserLogo) && $mediserLogo != '')
                    <img src="{{ $mediserLogo }}" class="footer-logo-img">
                @endif
            </td>
            <td align="center" width="33.3%">
                @if(isset($mksLogo) && $mksLogo != '')
                    <img src="{{ $mksLogo }}" class="footer-logo-img">
                @endif
            </td>
        </tr>
    </table>

</body>

</html>