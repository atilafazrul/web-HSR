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
            margin: 0.35in 20pt 1.05in 20pt;
        }

        div.WordSection1 {
            page: WordSection1;
        }

        @include('pdf.partials.footer_partner_logos_styles')

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
            margin-top: 0;
            margin-bottom: 6px;
            padding-bottom: 6px;
            width: 100%;
            border-collapse: collapse;
        }

        @include('pdf.partials.header_logo_styles')

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

        @include('pdf.partials.footer_qr_copyright_styles')
    </style>
</head>

<body lang="EN-US" style="word-wrap: break-word; position: relative;">

    @if(isset($watermark) && $watermark != '')
        <img src="{{ $watermark }}" class="watermark">
    @endif

    <div class="WordSection1">

        <!-- HEADER SECTION - Same as service-report -->
        @include('pdf.partials.header_company_block')


        <p class="MsoNormal" align="center" style="margin-top: 6px; margin-bottom: 0in; text-align: center">
            <b><u><span lang="EN-ID" style="font-size: 18.0pt; line-height: 107%">BERITA ACARA UJI FUNGSI</span></u></b>
        </p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <p class="MsoNormal" align="center" style="margin-bottom: 0in; text-align: center">
            <span lang="EN-ID">Nomor: {{ $nomor_surat ?? '(NOMER URUT SURAT)/BAUF-HSR/BULAN ROMAWI/2026' }}</span>
        </p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <p class="MsoNormal" style="margin-bottom: 0in">
            <span lang="EN-ID">Pada hari ini <b>{{ $nama_hari ?? '(NAMA HARI)' }}</b> Tanggal
                <b>{{ $tanggal_bauf ?? '(TANGGAL-BULAN-TAHUN)' }}</b> Telah dilaksanakan pemasangan dan uji fungsi/uji
                coba, untuk peralatan di bawah ini:</span>
        </p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        @include('pdf.partials.berita_acara_items_table')

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
            <span lang="EN-ID">{{ $kota_tanda_tangan ?? 'Tangerang' }}, {{ $tanggal_tanda_tangan ?? '(TANGGAL-BULAN-TAHUN)' }}</span>
        </p>

        <p class="MsoNormal" style="margin-bottom: 0in"><span lang="EN-ID">&nbsp;</span></p>

        <table class="MsoTableGrid" border="0" cellspacing="0" cellpadding="0"
            style="width: 100%; border-collapse: collapse; border: none;">
            <tr style="height: 119.85pt">
                <td width="301" valign="top" style="width: 225.4pt; padding: 0in 5.4pt 0in 5.4pt; height: 119.85pt">
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal">
                        <span lang="EN-ID">PT. HAYATI SEMESTA RAHARJA</span>
                    </p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
                    @include('pdf.partials.signature_block_hsr')
                </td>
                <td width="301" valign="top" style="width: 225.4pt; padding: 0in 5.4pt 0in 5.4pt; height: 119.85pt">
                    <p class="MsoNormal" align="center" style="margin-bottom: 0in; text-align: center; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" align="center" style="margin-bottom: 0in; text-align: center; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" align="center" style="margin-bottom: 0in; text-align: center; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" align="center" style="margin-bottom: 0in; text-align: center; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
                    @include('pdf.partials.signature_block_klien')
                </td>
            </tr>
        </table>

        <p class="MsoNormal"><span lang="EN-ID">&nbsp;</span></p>

    </div>

    <!-- FOOTER - Fixed at bottom: QR + 5 logos, satu baris -->
    <div class="footer">
        <table class="footer-table">
            <tr>
                @include('pdf.partials.footer_qr_copyright')
                <td class="footer-cell">
                    @if(isset($medimageLogo) && $medimageLogo != '')
                        <img src="{{ $medimageLogo }}" class="footer-logo">
                    @endif
                </td>
                <td class="footer-cell">
                    @if(isset($medhisLogo) && $medhisLogo != '')
                        <img src="{{ $medhisLogo }}" class="footer-logo">
                    @endif
                </td>
                <td class="footer-cell">
                    @if(isset($mediserLogo) && $mediserLogo != '')
                        <img src="{{ $mediserLogo }}" class="footer-logo">
                    @endif
                </td>
                <td class="footer-cell">
                    @if(isset($conexaLogo) && $conexaLogo != '')
                        <img src="{{ $conexaLogo }}" class="footer-logo">
                    @endif
                </td>
                <td class="footer-cell">
                    @if(isset($mksLogo) && $mksLogo != '')
                        <img src="{{ $mksLogo }}" class="footer-logo">
                    @endif
                </td>
            </tr>
        </table>
    </div>

</body>

</html>
