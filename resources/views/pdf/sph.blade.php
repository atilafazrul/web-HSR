<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
        @page {
            size: 595.3pt 841.9pt;
            margin: 0.75in 20pt 1.0in 20pt;
        }

        body {
            font-family: "Calibri", sans-serif;
            font-size: 11pt;
            color: #000;
            line-height: 1.35;
            /* Reserve space so content never overlaps fixed footer (QR + partner logos) */
            padding-bottom: 50px;
        }

        p {
            margin: 0 0 8pt 0;
        }

        .header-table {
            border-bottom: 2px solid #000;
            margin-bottom: 10px;
            padding-bottom: 8px;
            width: 100%;
            border-collapse: collapse;
        }

        .header-logo {
            height: 70px;
            width: auto;
            max-width: 100%;
            object-fit: contain;
        }

        .logo-left {
            width: 15%;
            vertical-align: middle;
        }

        .logo-right {
            width: 15%;
            text-align: right;
            vertical-align: middle;
        }

        .company-info {
            width: 70%;
            text-align: center;
            vertical-align: middle;
        }

        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 3px;
        }

        .address-info {
            font-size: 10px;
            line-height: 1.3;
        }

        .meta-table {
            width: 100%;
            margin: 12px 0 16px 0;
            border-collapse: collapse;
        }

        .meta-table td {
            padding: 2px 0;
            vertical-align: top;
        }

        .meta-label {
            width: 70px;
        }

        .meta-sep {
            width: 12px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
        }

        .items-table th,
        .items-table td {
            border: 1px solid #000;
            padding: 6px 8px;
            vertical-align: top;
        }

        .items-table th {
            text-align: center;
            font-weight: bold;
        }

        .col-no {
            width: 28px;
            text-align: center;
        }

        .col-item {
            width: 18%;
        }

        .col-desc {
            width: 32%;
        }

        .col-qty {
            width: 40px;
            text-align: center;
        }

        .col-price,
        .col-total {
            width: 18%;
            text-align: right;
            white-space: nowrap;
        }

        .total-row td {
            font-weight: bold;
        }

        .closing-section {
            margin-top: 12px;
        }

        .signature-block {
            margin-top: 10px;
            width: 240px;
            margin-left: auto;
            margin-right: 12px;
            text-align: right;
            /* Nudge down without affecting page flow (avoid page break) */
            position: relative;
            top: 8px;
        }

        .signature-space {
            min-height: 72px;
            text-align: center;
        }

        .signature-space img {
            height: 72px;
            width: auto;
            max-width: 220px;
            display: block;
            margin: 0 0 0 auto;
            /* Cap + TTD only — slightly to the right */
            position: relative;
            left: 42px;
        }

        @include('pdf.partials.footer_partner_logos_styles')
        /* SPH: lower partner logos a bit more (match other letters) */
        .footer {
            bottom: -34px !important;
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

        .rich-content ul,
        .rich-content ol {
            margin: 0;
            padding-left: 18px;
        }

        @include('pdf.partials.footer_qr_copyright_styles')
        /* SPH: move QR block slightly lower */
        .pdf-qr-copyright {
            bottom: 46px !important;
        }
    </style>
</head>

<body>
    @if(!empty($watermark))
        <img src="{{ $watermark }}" class="watermark" alt="">
    @endif

    <table class="header-table">
        <tr>
            <td class="logo-left">
                @if(!empty($hsrLogo))
                    <img src="{{ $hsrLogo }}" class="header-logo" alt="">
                @endif
            </td>
            <td class="company-info">
                <div class="company-name">PT. HAYATI SEMESTA RAHARJA</div>
                <div class="address-info">
                    Jl. Raya Pasar Kemis, Kp. Picung RT 004/005, Pasar Kemis<br>
                    Kabupaten Tangerang, Banten 15560<br>
                    Telp. 021-38962963 | HP. 08999-222-69<br>
                    Website: www.pthsr.id | Email: halo@pthsr.id
                </div>
            </td>
            <td class="logo-right">
                @if(!empty($isoLogo))
                    <img src="{{ $isoLogo }}" class="header-logo" alt="">
                @endif
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td class="meta-label">Nomor</td>
            <td class="meta-sep">:</td>
            <td>{{ $nomor_surat }}</td>
        </tr>
        <tr>
            <td class="meta-label">Lampiran</td>
            <td class="meta-sep">:</td>
            <td>{{ $lampiran ?? '-' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Hal</td>
            <td class="meta-sep">:</td>
            <td>{{ $perihal ?? 'Penawaran Harga' }}</td>
        </tr>
    </table>

    <p>Yth.,<br><strong>{{ $penerima_nama }}</strong><br>Di tempat</p>

    <p>Dengan Hormat,</p>

    <div class="rich-content">
        @if(!empty($paragraf_pembuka))
            {!! $paragraf_pembuka !!}
        @else
            <p>Sehubungan dengan kebutuhan infrastruktur TI di perusahaan bapak/ibu, bersama ini kami dari PT. Hayati Semesta Raharja mengajukan penawaran sesuai dengan kebutuhan sistem di perusahaan bapak/ibu.</p>
            <p>Berikut kami sampaikan rincian penawarannya:</p>
        @endif
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th class="col-no">No</th>
                <th class="col-item">Nama Item</th>
                <th class="col-desc">Deskripsi</th>
                <th class="col-qty">QTY</th>
                <th class="col-price">Harga</th>
                <th class="col-total">Total Harga</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $item)
                <tr>
                    <td class="col-no">{{ $item['no'] ?? $loop->iteration }}</td>
                    <td>{{ $item['nama_item'] ?? '-' }}</td>
                    <td>{!! $item['deskripsi_html'] ?? '' !!}</td>
                    <td class="col-qty">{{ $item['qty'] ?? '1' }}</td>
                    <td class="col-price">{{ $item['harga_formatted'] ?? '' }}</td>
                    <td class="col-total">{{ $item['total_harga_formatted'] ?? '' }}</td>
                </tr>
            @endforeach
            <tr class="total-row">
                <td colspan="5" style="text-align:right;">Total</td>
                <td class="col-total">{{ $total_harga_formatted ?? '' }}</td>
            </tr>
        </tbody>
    </table>

    <div class="closing-section">
        <p><strong>Syarat dan Ketentuan:</strong></p>
        <div class="rich-content">
            @if(!empty($syarat_ketentuan))
                {!! $syarat_ketentuan !!}
            @else
                <ol>
                    <li>Harga belum termasuk PPN 11%.</li>
                    <li>Pembayaran dilakukan 100% setelah barang diterima.</li>
                    <li>Penawaran ini berlaku selama 30 (tiga puluh) hari dari tanggal penerbitan penawaran.</li>
                </ol>
            @endif
        </div>

        <div class="rich-content" style="margin-top:12px;">
            @if(!empty($paragraf_penutup))
                {!! $paragraf_penutup !!}
            @endif
        </div>

        <div class="signature-block">
            <p>{{ $kota_tanda_tangan ?? 'Tangerang' }}, {{ $tanggal_tanda_tangan }}</p>
            <p>PT HSR,</p>
            <div class="signature-space">
                @if(!empty($ttd_penandatangan))
                    <img src="{{ $ttd_penandatangan }}" alt="Tanda Tangan & Cap">
                @endif
            </div>
            <p><strong><u>{{ $nama_penandatangan ?? '________________' }}</u></strong><br>{{ $jabatan_penandatangan ?? 'Direktur' }}</p>
        </div>
    </div>

    @include('pdf.partials.footer_qr_copyright')

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td class="footer-cell" width="20%">
                    @if(!empty($medimageLogo))<img src="{{ $medimageLogo }}" class="footer-logo" alt="">@endif
                </td>
                <td class="footer-cell" width="20%">
                    @if(!empty($medhisLogo))<img src="{{ $medhisLogo }}" class="footer-logo" alt="">@endif
                </td>
                <td class="footer-cell" width="20%">
                    @if(!empty($mediserLogo))<img src="{{ $mediserLogo }}" class="footer-logo" alt="">@endif
                </td>
                <td class="footer-cell" width="20%">
                    @if(!empty($conexaLogo))<img src="{{ $conexaLogo }}" class="footer-logo" alt="">@endif
                </td>
                <td class="footer-cell" width="20%">
                    @if(!empty($mksLogo))<img src="{{ $mksLogo }}" class="footer-logo" alt="">@endif
                </td>
            </tr>
        </table>
    </div>
</body>

</html>
