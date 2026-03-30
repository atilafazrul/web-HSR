<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
        /* Font Definitions */
        @font-face {
            font-family: "Cambria Math";
            panose-1: 2 4 5 3 5 4 6 3 2 4;
        }

        @font-face {
            font-family: Calibri;
            panose-1: 2 15 5 2 2 2 4 3 2 4;
        }

        /* Style Definitions */
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

        /* Page Definitions */
        @page WordSection1 {
            size: 595.3pt 841.9pt;
            margin: 0.8in 20pt 1.4in 20pt;
        }

        div.WordSection1 {
            page: WordSection1;
        }

        /* FOOTER - Fixed at bottom */
        .footer {
            position: fixed;
            bottom: 0;
            left: 20pt;
            right: 20pt;
            text-align: center;
            padding-top: 5px;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
        }

        .footer-logo {
            height: 50px;
            width: auto;
            max-width: 100%;
            object-fit: contain;
        }

        .footer-cell {
            text-align: center;
            vertical-align: middle;
            padding: 0 3px;
        }

        /* List Definitions */
        ol {
            margin-bottom: 0in;
        }

        ul {
            margin-bottom: 0in;
        }

        /* Table Styles */
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

        /* HEADER SECTION - Same as service-report */
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

        /* WATERMARK - Background logo */
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

<body lang="EN-US" style="word-wrap: break-word; position: relative;">

    @if(isset($watermark) && $watermark != '')
        <img src="{{ $watermark }}" class="watermark">
    @endif

    <div class="WordSection1">

        <!-- HEADER SECTION - Same as service-report -->
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

        <p class="MsoNormal"><span lang="EN-ID">&nbsp;</span></p>

        <p class="MsoNormal" align="center" style="margin-bottom: 0in; text-align: center">
            <b><u><span lang="EN-ID" style="font-size: 18.0pt; line-height: 107%">BERITA ACARA UJI FUNGSI</span></u></b>
        </p>

        <p class="MsoNormal" align="center" style="margin-bottom: 0in; text-align: center">
            <span lang="EN-ID">Nomor : {{ $nomor_surat ?? '(NOMER URUT SURAT)/BAUF-HSR/BULAN ROMAWI/2026' }}</span>
        </p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <p class="MsoNormal" style="margin-bottom: 0in">
            <span lang="EN-ID">Pada hari ini <b>{{ $nama_hari ?? '(NAMA HARI)' }}</b> Tanggal
                <b>{{ $tanggal_bauf ?? '(TANGGAL-BULAN-TAHUN)' }}</b> Telah dilaksanakan pemasangan dan uji fungsi/uji
                coba, untuk peralatan di bawah ini :</span>
        </p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <table class="MsoTableGrid" border="1" cellspacing="0" cellpadding="0"
            style="width: 100%; border-collapse: collapse;">
            <tr style="height: 3.55pt">
                <td width="56" valign="top"
                    style="width: 41.85pt; border: solid windowtext 1.0pt; padding: 0in 5.4pt 0in 5.4pt; height: 3.55pt">
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal">
                        <span lang="EN-ID">NO</span>
                    </p>
                </td>
                <td width="327" valign="top"
                    style="width: 244.9pt; border: solid windowtext 1.0pt; border-left: none; padding: 0in 5.4pt 0in 5.4pt; height: 3.55pt">
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal">
                        <span lang="EN-ID">NAMA ALAT</span>
                    </p>
                </td>
                <td width="135" valign="top"
                    style="width: 101.25pt; border: solid windowtext 1.0pt; border-left: none; padding: 0in 5.4pt 0in 5.4pt; height: 3.55pt">
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal">
                        <span lang="EN-ID">MERK</span>
                    </p>
                </td>
                <td width="135" valign="top"
                    style="width: 101.25pt; border: solid windowtext 1.0pt; border-left: none; padding: 0in 5.4pt 0in 5.4pt; height: 3.55pt">
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal">
                        <span lang="EN-ID">JUMLAH</span>
                    </p>
                </td>
            </tr>

            @if(isset($items) && count($items) > 0)
                @foreach($items as $index => $item)
                    <tr style="height: 28.45pt">
                        <td width="56" valign="top"
                            style="width: 41.85pt; border: solid windowtext 1.0pt; border-top: none; padding: 0in 5.4pt 0in 5.4pt; height: 28.45pt">
                            <p class="MsoNormal" align="center"
                                style="margin-bottom: 0in; text-align: center; line-height: normal">
                                <span lang="EN-ID">{{ $index + 1 }}</span>
                            </p>
                        </td>
                        <td width="327" valign="top"
                            style="width: 244.9pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0in 5.4pt 0in 5.4pt; height: 28.45pt">
                            <p class="MsoNormal" align="center"
                                style="margin-bottom: 0in; text-align: center; line-height: normal">
                                <span lang="EN-ID">{{ $item['nama_alat'] ?? '-' }}</span>
                            </p>
                        </td>
                        <td width="135" valign="top"
                            style="width: 101.25pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0in 5.4pt 0in 5.4pt; height: 28.45pt">
                            <p class="MsoNormal" align="center"
                                style="margin-bottom: 0in; text-align: center; line-height: normal">
                                <span lang="EN-ID">{{ $item['merk'] ?? '-' }}</span>
                            </p>
                        </td>
                        <td width="135" valign="top"
                            style="width: 101.25pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0in 5.4pt 0in 5.4pt; height: 28.45pt">
                            <p class="MsoNormal" align="center"
                                style="margin-bottom: 0in; text-align: center; line-height: normal">
                                <span lang="EN-ID">{{ $item['jumlah'] ?? '-' }}</span>
                            </p>
                        </td>
                    </tr>
                @endforeach
            @else
                <tr style="height: 28.45pt">
                    <td width="56" valign="top"
                        style="width: 41.85pt; border: solid windowtext 1.0pt; border-top: none; padding: 0in 5.4pt 0in 5.4pt; height: 28.45pt">
                        <p class="MsoNormal" align="center"
                            style="margin-bottom: 0in; text-align: center; line-height: normal">
                            <span lang="EN-ID">1</span>
                        </p>
                    </td>
                    <td width="327" valign="top"
                        style="width: 244.9pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0in 5.4pt 0in 5.4pt; height: 28.45pt">
                        <p class="MsoNormal" align="center"
                            style="margin-bottom: 0in; text-align: center; line-height: normal">
                            <span lang="EN-ID">C - ARM</span>
                        </p>
                    </td>
                    <td width="135" valign="top"
                        style="width: 101.25pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0in 5.4pt 0in 5.4pt; height: 28.45pt">
                        <p class="MsoNormal" align="center"
                            style="margin-bottom: 0in; text-align: center; line-height: normal">
                            <span lang="EN-ID">Siemens</span>
                        </p>
                    </td>
                    <td width="135" valign="top"
                        style="width: 101.25pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 0in 5.4pt 0in 5.4pt; height: 28.45pt">
                        <p class="MsoNormal" align="center"
                            style="margin-bottom: 0in; text-align: center; line-height: normal">
                            <span lang="EN-ID">1</span>
                        </p>
                    </td>
                </tr>
            @endif
        </table>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <p class="MsoNormal" style="margin-bottom: 0in">
            <span lang="EN-ID">Dengan ini kami menyatakan bahwa telah melaksanakan pemasangan uji fungsi/uji coba peralatan tersebut di
                <b>{{ $nama_klient ?? '(NAMA KLIENT)' }}</b> dengan hasil
                <b><i><u>{{ $hasil ?? 'BAIK' }}</u></i></b></span>
        </p>

        <p class="MsoNormal" style="margin-bottom: 0in">
            <b><i><u><span lang="EN-ID"><span style="text-decoration: none">&nbsp;</span></span></u></i></b>
        </p>

        <p class="MsoNormal" style="margin-bottom: 0in">
            <span lang="EN-ID">Demikian berita acara ini kami buat untuk dapat digunakan sebagaimana mestinya.</span>
        </p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <p class="MsoNormal" style="margin-bottom: 0in">
            <span lang="EN-ID">Tangerang, {{ $tanggal_tanda_tangan ?? '(TANGGAL-BULAN-TAHUN)' }}</span>
        </p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <table class="MsoTableGrid" border="0" cellspacing="0" cellpadding="0"
            style="width: 100%; border-collapse: collapse; border: none;">
            <tr style="height: 119.85pt">
                <td width="301" valign="top" style="width: 225.4pt; padding: 0in 5.4pt 0in 5.4pt; height: 119.85pt">
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal">
                        <span lang="EN-ID">PT. HAYATI SEMESTA RAHARJA</span>
                    </p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal">
                        <span
                            lang="EN-ID">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</span>
                    </p>
                </td>
                <td width="301" valign="top" style="width: 225.4pt; padding: 0in 5.4pt 0in 5.4pt; height: 119.85pt">
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal"><span
                            lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" align="right"
                        style="margin-bottom: 0in; text-align: right; line-height: normal">
                        <span
                            lang="EN-ID">(&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)</span>
                    </p>
                </td>
            </tr>
        </table>

        <p class="MsoNormal"><span lang="EN-ID">&nbsp;</span></p>

    </div>

    <!-- FOOTER - Fixed at bottom with 5 logos -->
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
