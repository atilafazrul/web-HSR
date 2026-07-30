<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
        @page {
            size: 595.3pt 841.9pt;
            margin: 0.35in 20pt 0.9in 20pt;
        }

        body {
            font-family: "Times-Roman", "Times New Roman", Times, serif;
            font-size: 11pt;
            color: #000;
            line-height: 1.35;
            padding-bottom: 40px;
        }

        p { margin: 0 0 6pt 0; }

        .header-table {
            border-bottom: 2px solid #000;
            margin-top: 0;
            margin-bottom: 10px;
            padding-bottom: 6px;
            width: 100%;
            border-collapse: collapse;
        }

        @include('pdf.partials.header_logo_styles')

        .po-title {
            font-size: 20pt;
            font-weight: bold;
            text-align: center;
            letter-spacing: 1px;
            text-decoration: underline;
            margin: 10px 0 14px 0;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .meta-table td {
            padding: 2px 0;
            vertical-align: top;
        }

        .meta-label { width: 70px; white-space: nowrap; }
        .meta-sep { width: 14px; }

        .party-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            border: 1px solid #000;
        }

        .party-table td {
            width: 50%;
            vertical-align: top;
            border: 1px solid #000;
            padding: 8px 10px;
        }

        .party-label {
            font-weight: bold;
            margin-bottom: 4px;
        }

        .terms-table,
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }

        .terms-table th,
        .terms-table td,
        .items-table th,
        .items-table td {
            border: 1px solid #000;
            padding: 6px 8px;
            vertical-align: top;
        }

        .terms-table th,
        .items-table th {
            text-align: center;
            font-weight: bold;
            background: #f5f5f5;
        }

        .terms-table td {
            height: 28px;
            text-align: center;
        }

        .col-no { width: 40px; text-align: center; }
        .col-qty { width: 50px; text-align: center; }
        .col-price, .col-total { width: 110px; text-align: right; white-space: nowrap; }

        .items-table .summary-label {
            text-align: right;
            font-weight: bold;
            vertical-align: middle;
        }

        .items-table .summary-value {
            text-align: right;
            white-space: nowrap;
            vertical-align: middle;
        }

        .signature-block {
            width: 42%;
            margin-left: auto;
            text-align: center;
            margin-top: 8px;
        }

        .signature-block .sign-date {
            text-align: center;
            margin-bottom: 2px;
        }

        .signature-space {
            height: 70px;
            margin: 4px 0;
        }

        .signature-space img {
            height: 64px;
            width: auto;
            max-width: 170px;
            display: block;
            margin: 0 auto;
        }

        .watermark {
            position: fixed;
            top: 45%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 420px;
            opacity: 0.06;
            z-index: -1;
        }

        @include('pdf.partials.footer_partner_logos_styles')
        .footer { bottom: -28px !important; }

        @include('pdf.partials.footer_qr_copyright_styles')
        .pdf-qr-copyright { bottom: 42px !important; }
    </style>
</head>
<body>
    @if(!empty($watermark))
        <img src="{{ $watermark }}" class="watermark" alt="">
    @endif

    @include('pdf.partials.header_company_block')

    <div class="po-title">PURCHASE ORDER</div>

    <table class="meta-table">
        <tr>
            <td class="meta-label">PO</td>
            <td class="meta-sep">:</td>
            <td><strong>{{ $nomor_surat }}</strong></td>
        </tr>
        <tr>
            <td class="meta-label">PO Date</td>
            <td class="meta-sep">:</td>
            <td>{{ $tanggal_po }}</td>
        </tr>
    </table>

    <table class="party-table">
        <tr>
            <td>
                <div class="party-label">To :</div>
                <div><strong>{{ $to_nama }}</strong></div>
                <div>{!! nl2br(e($to_alamat ?? '')) !!}</div>
            </td>
            <td>
                <div class="party-label">Ship To / Location Project :</div>
                <div><strong>{{ $ship_to_nama }}</strong></div>
                <div>{!! nl2br(e($ship_to_alamat ?? '')) !!}</div>
            </td>
        </tr>
    </table>

    <table class="terms-table">
        <thead>
            <tr>
                <th style="width:33%;">FOB</th>
                <th style="width:33%;">Shipped Via</th>
                <th style="width:34%;">Payment Term</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{!! filled($fob ?? null) ? e($fob) : '&nbsp;' !!}</td>
                <td>{!! filled($shipped_via ?? null) ? e($shipped_via) : '&nbsp;' !!}</td>
                <td>{{ $payment_term ?: 'Cash On Delivery' }}</td>
            </tr>
        </tbody>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th class="col-no">Item No</th>
                <th>Description</th>
                <th class="col-qty">Qty</th>
                <th class="col-price">Unit Price</th>
                <th class="col-total">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
                <tr>
                    <td class="col-no">{{ ($item['no'] ?? $loop->iteration) }}.</td>
                    <td>{!! $item['deskripsi_html'] ?? e($item['deskripsi'] ?? '-') !!}</td>
                    <td class="col-qty">{{ $item['qty'] ?? 1 }}</td>
                    <td class="col-price">{{ $item['harga_formatted'] ?? '' }}</td>
                    <td class="col-total">{{ $item['total_harga_formatted'] ?? '' }}</td>
                </tr>
            @endforeach
            <tr>
                <td colspan="4" class="summary-label">Sub Total</td>
                <td class="summary-value">{{ $subtotal_formatted ?? '' }}</td>
            </tr>
            <tr>
                <td colspan="4" class="summary-label">PPN</td>
                <td class="summary-value">{{ $ppn_formatted ?? '' }}</td>
            </tr>
            <tr>
                <td colspan="4" class="summary-label">Total</td>
                <td class="summary-value"><strong>{{ $total_harga_formatted ?? '' }}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="signature-block">
        <div class="sign-date">{{ $kota_tanda_tangan ?? 'Tangerang' }}, {{ $tanggal_po }}</div>
        <div>PT HSR</div>
        <div class="signature-space">
            @if(!empty($ttd_penandatangan))
                <img src="{{ $ttd_penandatangan }}" alt="TTD">
            @endif
        </div>
        <div><strong><u>{{ $nama_penandatangan ?? 'Syahrul Roji' }}</u></strong></div>
    </div>

    @include('pdf.partials.footer_qr_copyright')

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td class="footer-cell" width="20%">@if(!empty($medimageLogo))<img src="{{ $medimageLogo }}" class="footer-logo" alt="">@endif</td>
                <td class="footer-cell" width="20%">@if(!empty($medhisLogo))<img src="{{ $medhisLogo }}" class="footer-logo" alt="">@endif</td>
                <td class="footer-cell" width="20%">@if(!empty($mediserLogo))<img src="{{ $mediserLogo }}" class="footer-logo" alt="">@endif</td>
                <td class="footer-cell" width="20%">@if(!empty($conexaLogo))<img src="{{ $conexaLogo }}" class="footer-logo" alt="">@endif</td>
                <td class="footer-cell" width="20%">@if(!empty($mksLogo))<img src="{{ $mksLogo }}" class="footer-logo" alt="">@endif</td>
            </tr>
        </table>
    </div>
</body>
</html>
