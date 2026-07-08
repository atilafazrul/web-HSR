<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
        @font-face {
            font-family: "Cambria Math";
            panose-1: 2 4 5 3 5 4 6 3 2 4;
        }

        @font-face {
            font-family: Calibri;
            panose-1: 2 15 5 2 2 2 4 3 2 4;
        }

        p.MsoNormal,
        li.MsoNormal,
        div.MsoNormal {
            margin-top: 0in;
            margin-right: 0in;
            margin-bottom: 8.0pt;
            margin-left: 0in;
            line-height: 107%;
            font-size: 11.0pt;
            font-family: "Calibri", sans-serif;
        }

        p.MsoHeader,
        li.MsoHeader,
        div.MsoHeader {
            margin: 0in;
            font-size: 11.0pt;
            font-family: "Calibri", sans-serif;
        }

        p.MsoFooter,
        li.MsoFooter,
        div.MsoFooter {
            margin: 0in;
            font-size: 11.0pt;
            font-family: "Calibri", sans-serif;
        }

        .MsoChpDefault {
            font-family: "Calibri", sans-serif;
        }

        .MsoPapDefault {
            margin-bottom: 8.0pt;
            line-height: 107%;
        }

        @page WordSection1 {
            size: 595.3pt 841.9pt;
            margin: 0.8in 20pt 1.05in 20pt;
        }

        div.WordSection1 {
            page: WordSection1;
        }

        @include('pdf.partials.footer_partner_logos_styles')

        ol {
            margin-bottom: 0in;
        }

        ul {
            margin-bottom: 0in;
        }

        table.MsoTableGrid {
            border-collapse: collapse;
            border: none;
        }

        table.MsoTableGrid td {
            border: solid windowtext 1.0pt;
            padding: 0in 5.4pt 0in 5.4pt;
        }

        table.MsoTableGrid tr:first-child td {
            border-top: solid windowtext 1.0pt;
        }

        table.MsoTableGrid td:first-child {
            border-left: solid windowtext 1.0pt;
        }

        .header-table {
            border-bottom: 2px solid #000;
            margin-bottom: 5px;
            padding-bottom: 10px;
            width: 100%;
            border-collapse: collapse;
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
            width: 15%;
        }

        .logo-right {
            text-align: right;
            vertical-align: middle;
            width: 15%;
        }

        .company-info {
            text-align: center;
            vertical-align: middle;
            width: 70%;
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

        .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            opacity: 0.08;
            z-index: -1;
        }

        .sppd-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        .sppd-table td {
            border: 1px solid black;
            padding: 6px 10px;
            vertical-align: top;
            font-size: 11.0pt;
            font-family: "Calibri", sans-serif;
        }

        .col-num {
            width: 30px;
            text-align: center;
        }

        .col-label {
            width: 280px;
        }

        .col-value {
            width: auto;
        }

        .signature-wrapper {
            width: 100%;
            margin-top: 20px;
            font-size: 11.0pt;
            font-family: "Calibri", sans-serif;
        }

        .sig-table {
            width: 100%;
            border: none;
        }

        .sig-table td {
            width: 50%;
            border: none;
            text-align: center;
            vertical-align: top;
        }

        .sig-space {
            height: 80px;
        }

        .name-bold {
            font-weight: bold;
            text-decoration: underline;
        }

        @include('pdf.partials.footer_qr_copyright_styles')
    </style>
</head>

<body lang="EN-US" style="word-wrap: break-word; position: relative;">

    @if(isset($watermark) && $watermark != '')
        <img src="{{ $watermark }}" class="watermark">
    @endif

    <div class="WordSection1">

        <table class="header-table">
            <tr>
                <td class="logo-left">
                    @if(isset($hsrLogo) && $hsrLogo != '')
                        <img src="{{ $hsrLogo }}" class="header-logo">
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
                    @if(isset($isoLogo) && $isoLogo != '')
                        <img src="{{ $isoLogo }}" class="header-logo">
                    @endif
                </td>
            </tr>
        </table>

        <p class="MsoNormal" align="center" style="margin-bottom: 0in; text-align: center">
            <b><u><span lang="EN-ID" style="font-size: 16.0pt; line-height: 107%">SURAT PERINTAH PERJALANAN DINAS</span></u></b>
        </p>

        <p class="MsoNormal" align="center" style="margin-bottom: 0in; text-align: center">
            <span lang="EN-ID">NOMOR: {{ $nomor_surat ?? '001/SPPD-HSR/I/2026' }}</span>
        </p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <table class="sppd-table">
            <tr>
                <td class="col-num">1.</td>
                <td class="col-label">Pejabat yang memberi perintah</td>
                <td class="col-value">{{ $pejabat_perintah ?? '-' }}</td>
            </tr>
            <tr>
                <td class="col-num">2.</td>
                <td class="col-label">Nama / NIP Pegawai yang diperintah</td>
                <td class="col-value">{{ $nama_pegawai ?? '-' }}</td>
            </tr>
            <tr>
                <td class="col-num">3.</td>
                <td class="col-label">Jabatan, pangkat dan golongan pegawai yang diperintah</td>
                <td class="col-value">{{ $jabatan ?? '-' }}</td>
            </tr>
            <tr>
                <td class="col-num">4.</td>
                <td class="col-label">
                    Perjalanan Dinas yang diperintahkan<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;Dari<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;Ke
                </td>
                <td class="col-value">
                    <br>
                    {{ $tempat_berangkat ?? '-' }}<br>
                    {{ $tempat_tujuan ?? '-' }}
                </td>
            </tr>
            <tr>
                <td class="col-num">5.</td>
                <td class="col-label">Transportasi yang digunakan</td>
                <td class="col-value">{{ $transportasi ?? '-' }}</td>
            </tr>
            <tr>
                <td class="col-num">6.</td>
                <td class="col-label">
                    Perjalanan dinas direncanakan selama<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;Dari tanggal<br>
                    &nbsp;&nbsp;&nbsp;&nbsp;Sampai tanggal
                </td>
                <td class="col-value">
                    <br>
                    {{ $tanggal_berangkat ?? '-' }}<br>
                    {{ $tanggal_kembali ?? '-' }}
                </td>
            </tr>
            <tr>
                <td class="col-num">7.</td>
                <td class="col-label">Maksud perjalanan dinas</td>
                <td class="col-value">{{ $maksud ?? '-' }}</td>
            </tr>
            <tr>
                <td class="col-num">8.</td>
                <td class="col-label">Pengikut Perjalanan Dinas<br>&nbsp;&nbsp;&nbsp;&nbsp;Nama / NIP</td>
                <td class="col-value">{{ $pengikut_nama ?? '-' }}</td>
            </tr>
            <tr>
                <td class="col-num">9.</td>
                <td class="col-label">Perhitungan perjalanan dinas<br>&nbsp;&nbsp;&nbsp;&nbsp;Atas beban</td>
                <td class="col-value">{{ $atas_beban ?? '-' }}</td>
            </tr>
            <tr>
                <td class="col-num">10.</td>
                <td class="col-label">Keterangan</td>
                <td class="col-value">{{ $keterangan ?? '-' }}</td>
            </tr>
        </table>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <div class="signature-wrapper">
            <table class="sig-table">
                <tr>
                    <td>
                        <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal">
                            <span lang="EN-ID">Dibuat oleh,</span>
                        </p>
                        @include('pdf.partials.signature_with_cap', [
                            'signature' => $ttd_dibuat_oleh ?? null,
                            'blankLines' => 5,
                            'merged' => false,
                        ])
                        <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal">
                            <span lang="EN-ID"><span class="name-bold">{{ $dibuat_oleh ?? '-' }}</span></span>
                        </p>
                    </td>
                    <td>
                        <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal">
                            <span lang="EN-ID">Tangerang, {{ $tanggal_tanda_tangan ?? '-' }}</span>
                        </p>
                        <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal">
                            <span lang="EN-ID">Menyetujui,</span>
                        </p>
                        @include('pdf.partials.signature_with_cap', [
                            'signature' => $ttd_menyetujui ?? null,
                            'blankLines' => 4,
                            'merged' => true,
                        ])
                        <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal">
                            <span lang="EN-ID"><span class="name-bold">{{ $approve_nama ?? '-' }}</span></span>
                        </p>
                        <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal">
                            <span lang="EN-ID">{{ $approve_jabatan ?? 'Direktur' }}</span>
                        </p>
                    </td>
                </tr>
            </table>
        </div>

    </div>

    @include('pdf.partials.footer_qr_copyright')

    <div class="footer">
        <table class="footer-table">
            <tr>
                <td class="footer-cell" width="20%">
                    @if(isset($medimageLogo) && $medimageLogo != '')
                        <img src="{{ $medimageLogo }}" class="footer-logo">
                    @endif
                </td>
                <td class="footer-cell" width="20%">
                    @if(isset($medhisLogo) && $medhisLogo != '')
                        <img src="{{ $medhisLogo }}" class="footer-logo">
                    @endif
                </td>
                <td class="footer-cell" width="20%">
                    @if(isset($mediserLogo) && $mediserLogo != '')
                        <img src="{{ $mediserLogo }}" class="footer-logo">
                    @endif
                </td>
                <td class="footer-cell" width="20%">
                    @if(isset($conexaLogo) && $conexaLogo != '')
                        <img src="{{ $conexaLogo }}" class="footer-logo">
                    @endif
                </td>
                <td class="footer-cell" width="20%">
                    @if(isset($mksLogo) && $mksLogo != '')
                        <img src="{{ $mksLogo }}" class="footer-logo">
                    @endif
                </td>
            </tr>
        </table>
    </div>

</body>

</html>