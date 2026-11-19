<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
        @page {
            size: 595.3pt 841.9pt;
            margin: 0.28in 20pt 0.75in 20pt;
        }

        body {
            font-family: "Calibri", sans-serif;
            font-size: 10.5pt;
            color: #000;
            line-height: 1.3;
            /* Reserve space so content never overlaps fixed footer (QR + partner logos) */
            padding-bottom: 45px;
        }

        p {
            margin: 0 0 5pt 0;
        }

        .header-table {
            border-bottom: 2px solid #000;
            margin-top: 0;
            margin-bottom: 5px;
            padding-bottom: 5px;
            width: 100%;
            border-collapse: collapse;
        }

        @include('pdf.partials.header_logo_styles')

        .meta-table {
            width: 100%;
            margin: 6px 0 10px 0;
            border-collapse: collapse;
        }

        .meta-table td {
            padding: 1.5px 0;
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
            margin-top: 6px;
        }

        .items-table th,
        .items-table td {
            border: 1px solid #000;
            padding: 4px 6px;
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
            margin-top: 8px;
        }

        .signature-block {
            margin-top: 6px;
            width: 240px;
            margin-left: auto;
            margin-right: 12px;
            text-align: right;
            page-break-inside: avoid;
        }

        .signature-space {
            min-height: 55px;
            text-align: center;
        }

        .signature-space img {
            height: 55px;
            width: auto;
            max-width: 200px;
            display: block;
            margin: 0 0 0 auto;
            /* Cap + TTD only — slightly to the right */
            position: relative;
            left: 35px;
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
            opacity: 0.2;
            z-index: -1;
        }

        .items-table td ul,
        .items-table td ol {
            margin: 0;
            padding-left: 16px;
        }

        .rich-content ul,
        .rich-content ol {
            margin: 0;
            padding-left: 18px;
        }

        .rich-content p {
            text-align: justify;
        }

        .items-table td img {
            max-width: 180px;
            max-height: 140px;
            height: auto;
            display: block;
            margin: 6px 0;
        }

        .rekap-banner-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0 10px 0;
        }

        .rekap-banner-cell {
            background-color: #651877;
            color: #ffffff;
            text-align: center;
            padding: 8px 12px;
            font-weight: bold;
            line-height: 1.3;
        }

        .rekap-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 8.5pt;
        }

        .rekap-table th,
        .rekap-table td {
            border: 1px solid #000;
            padding: 4px 6px;
            vertical-align: middle;
        }

        .rekap-table th {
            background-color: #f2f2f2;
            text-align: center;
            font-weight: bold;
        }

        .rekap-category-row td {
            background-color: #f7f7f7;
            font-weight: bold;
        }

        .rekap-subtotal-row td {
            background-color: #fafafa;
        }

        .rekap-total-row td {
            background-color: #f5f5f5;
        }

        .rekap-grand-total-row td {
            background-color: #b4c6e7 !important;
        }

        @include('pdf.partials.footer_qr_copyright_styles')
    </style>
</head>

<body>
    @if(!empty($watermark))
        <img src="{{ $watermark }}" class="watermark" alt="">
    @endif

        @include('pdf.partials.header_company_block')


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
            @if(($divisi ?? '') === 'service')
                <p>Terima kasih atas kesempatan yang di berikan kepada kami, kami selaku Perusahaan Suplier Alat - alat Kesehatan dan Jasa Pemeliharaan / Perbaikan Alat - alat kesehatan, dengan ini perkenankan kami mengajukan penawaran harga barang dan jasa dengan rincian sebagai berikut :</p>
            @elseif(($divisi ?? '') === 'kontraktor')
                <p>Terima kasih atas kesempatan yang telah diberikan kepada kami, kami PT. Hayati Semesta Raharja sebagai Kontraktor Ruang Medis dan Kontraktor Umum. Melalui surat ini, izinkan kami mengirimkan surat penawaran dengan rincian sebagai berikut :</p>
            @else
                <p>Sehubungan dengan kebutuhan infrastruktur TI di perusahaan bapak/ibu, bersama ini kami dari PT. Hayati Semesta Raharja mengajukan penawaran sesuai dengan kebutuhan sistem di perusahaan bapak/ibu.</p>
                <p>Berikut kami sampaikan rincian penawarannya:</p>
            @endif
        @endif
    </div>

    @if(!empty($pakai_rekapitulasi) && ($divisi ?? '') === 'kontraktor')
        {{-- TABEL FORMAT KONTRAKTOR (BERHUBUNGAN LANGSUNG SEBAGAI RINGKASAN REKAPITULASI) --}}
        <table class="items-table">
            <thead>
                <tr>
                    <th class="col-no" style="width: 32px;">No.</th>
                    <th style="text-align: left; padding-left: 10px;">Deskripsi</th>
                    <th class="col-qty" style="width: 50px;">QTY</th>
                    <th style="width: 55px; text-align: center;">Unit</th>
                    <th class="col-price" style="width: 25%; text-align: right;">Harga</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                    <tr>
                        <td class="col-no">{{ $item['no'] ?? $loop->iteration }}.</td>
                        <td style="padding-left: 10px; font-weight: 500;">{{ $item['nama_item'] ?? '-' }}</td>
                        <td class="col-qty">{{ $item['qty'] ?? '1' }}</td>
                        <td style="text-align: center;">{{ $item['unit'] ?? 'Ls' }}</td>
                        <td class="col-price">{{ $item['harga_formatted'] ?? '' }}</td>
                    </tr>
                @endforeach
                <tr class="total-row">
                    <td colspan="4" style="text-align: right; font-weight: bold;">Total</td>
                    <td class="col-price" style="font-weight: bold;">{{ $subtotal_formatted ?? '' }}</td>
                </tr>
                @if(!empty($pakai_ppn))
                    <tr class="total-row">
                        <td colspan="4" style="text-align: right; font-weight: bold;">PPN {{ $ppn_persen_label ?? '11' }}%</td>
                        <td class="col-price" style="font-weight: bold;">{{ $ppn_formatted ?? '' }}</td>
                    </tr>
                @endif
                @if($show_total ?? true)
                    <tr class="total-row">
                        <td colspan="4" style="text-align: right; font-weight: bold;">Total Harga</td>
                        <td class="col-price" style="font-weight: bold;">{{ $total_harga_formatted ?? '' }}</td>
                    </tr>
                @endif
            </tbody>
        </table>
    @else
        {{-- TABEL FORMAT STANDAR (SERVICE / IT / LAINNYA) --}}
        <table class="items-table">
            <thead>
                <tr>
                    <th class="col-no">No</th>
                    <th class="col-item">Nama Item</th>
                    @if(!empty($show_deskripsi_column))
                        <th class="col-desc">Deskripsi</th>
                    @endif
                    <th class="col-qty">QTY</th>
                    <th class="col-price">Harga Satuan</th>
                    @if($show_total ?? true)
                        <th class="col-total">Total Harga</th>
                    @endif
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                    <tr>
                        <td class="col-no">{{ $item['no'] ?? $loop->iteration }}</td>
                        <td>{{ $item['nama_item'] ?? '-' }}</td>
                        @if(!empty($show_deskripsi_column))
                            <td>{!! $item['deskripsi_html'] ?? '' !!}</td>
                        @endif
                        <td class="col-qty">{{ $item['qty'] ?? '1' }}</td>
                        <td class="col-price">{{ $item['harga_formatted'] ?? '' }}</td>
                        @if($show_total ?? true)
                            <td class="col-total">{{ $item['total_harga_formatted'] ?? '' }}</td>
                        @endif
                    </tr>
                @endforeach
                @php
                    $showTotalCol = $show_total ?? true;
                    $hasDiskon = !empty($pakai_diskon) && !empty($diskon_nominal);
                    $hasPpn = !empty($pakai_ppn);
                    $summaryColspan = (!empty($show_deskripsi_column) ? 1 : 0) + ($showTotalCol ? 4 : 3);
                    $valueColClass = $showTotalCol ? 'col-total' : 'col-price';
                @endphp

                @if($hasDiskon || $hasPpn || $showTotalCol)
                    @if($hasDiskon || $hasPpn)
                        <tr class="total-row">
                            <td colspan="{{ $summaryColspan }}" style="text-align:right;">Sub Total</td>
                            <td class="{{ $valueColClass }}">{{ $subtotal_formatted ?? '' }}</td>
                        </tr>
                        @if($hasDiskon)
                            <tr class="total-row">
                                <td colspan="{{ $summaryColspan }}" style="text-align:right;">Diskon ({{ $diskon_persen_label ?? '0' }}%)</td>
                                <td class="{{ $valueColClass }}">- {{ $diskon_formatted ?? '' }}</td>
                            </tr>
                        @endif
                        @if($hasPpn)
                            <tr class="total-row">
                                <td colspan="{{ $summaryColspan }}" style="text-align:right;">PPN ({{ $ppn_persen_label ?? '11' }}%)</td>
                                <td class="{{ $valueColClass }}">{{ $ppn_formatted ?? '' }}</td>
                            </tr>
                        @endif
                        @if($showTotalCol)
                            <tr class="total-row">
                                <td colspan="{{ $summaryColspan }}" style="text-align:right;">Total</td>
                                <td class="{{ $valueColClass }}">{{ $total_harga_formatted ?? '' }}</td>
                            </tr>
                        @endif
                    @else
                        @if($showTotalCol)
                            <tr class="total-row">
                                <td colspan="{{ $summaryColspan }}" style="text-align:right;">Total</td>
                                <td class="{{ $valueColClass }}">{{ $total_harga_formatted ?? '' }}</td>
                            </tr>
                        @endif
                    @endif
                @endif
            </tbody>
        </table>
    @endif

    <div class="closing-section">
        @if(!empty($syarat_ketentuan))
            <p><strong>Syarat dan Ketentuan:</strong></p>
            <div class="rich-content">
                {!! $syarat_ketentuan !!}
            </div>
        @endif

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

    @if(!empty($pakai_rekapitulasi) && ($divisi ?? '') === 'kontraktor' && !empty($rekapitulasi['groups']))
        <div style="page-break-before: always;"></div>

        @include('pdf.partials.header_company_block')

        <div style="text-align: center; font-size: 14pt; font-weight: bold; margin: 8px 0 4px 0; text-decoration: underline;">
            REKAPITULASI
        </div>

        <table class="rekap-banner-table">
            <tr>
                <td class="rekap-banner-cell">
                    <div style="font-size: 11pt; letter-spacing: 0.5px;">PT. HAYATI SEMESTA RAHARJA</div>
                    <div style="font-size: 9.5pt; font-weight: normal; margin-top: 2px;">TANGERANG</div>
                    <div style="font-size: 11pt; text-transform: uppercase; margin-top: 4px;">{{ $rekapitulasi_judul ?: ($perihal ?? 'REKAPITULASI BIAYA PEKERJAAN') }}</div>
                </td>
            </tr>
        </table>

        <table class="rekap-table">
            <thead>
                <tr>
                    <th rowspan="2" style="width: 28px;">NO.</th>
                    <th rowspan="2">DESKRIPSI</th>
                    <th rowspan="2" style="width: 50px;">SATUAN</th>
                    <th rowspan="2" style="width: 45px;">VOL</th>
                    <th colspan="2" style="width: 190px;">HARGA</th>
                    <th rowspan="2" style="width: 105px;">TOTAL HARGA</th>
                </tr>
                <tr>
                    <th style="width: 95px;">MATERIAL</th>
                    <th style="width: 95px;">JASA</th>
                </tr>
            </thead>
            <tbody>
                @foreach($rekapitulasi['groups'] as $group)
                    <tr class="rekap-category-row">
                        <td style="text-align: center;">{{ $group['nomor_romawi'] }}</td>
                        <td colspan="6" style="text-transform: uppercase;">{{ $group['judul_kategori'] }}</td>
                    </tr>
                    @foreach($group['items'] as $item)
                        <tr>
                            <td style="text-align: center;">{{ $item['nomor'] }}</td>
                            <td>{{ $item['deskripsi'] }}</td>
                            <td style="text-align: center;">{{ $item['satuan'] }}</td>
                            <td style="text-align: center;">{{ $item['vol'] }}</td>
                            <td style="text-align: right;">{{ $item['material_formatted'] }}</td>
                            <td style="text-align: right;">{{ $item['jasa_formatted'] }}</td>
                            <td style="text-align: right;">{{ $item['total_harga_formatted'] }}</td>
                        </tr>
                    @endforeach
                    <tr class="rekap-subtotal-row">
                        <td colspan="6" style="text-align: right; font-weight: bold; font-style: italic;">SUB TOTAL :</td>
                        <td style="text-align: right; font-weight: bold;">{{ $group['subtotal_formatted'] }}</td>
                    </tr>
                @endforeach

                <tr class="rekap-total-row">
                    <td colspan="6" style="text-align: right; font-weight: bold;">TOTAL</td>
                    <td style="text-align: right; font-weight: bold;">{{ $rekapitulasi['total_formatted'] }}</td>
                </tr>
                @if(!empty($pakai_ppn))
                    <tr class="rekap-total-row">
                        <td colspan="6" style="text-align: right; font-weight: bold;">VAT {{ $ppn_persen_label ?? '11' }}%</td>
                        <td style="text-align: right; font-weight: bold;">{{ $rekapitulasi['vat_formatted'] }}</td>
                    </tr>
                @endif
                <tr class="rekap-grand-total-row">
                    <td colspan="6" style="text-align: right; font-weight: bold;">GRAND TOTAL</td>
                    <td style="text-align: right; font-weight: bold;">{{ $rekapitulasi['grand_total_formatted'] }}</td>
                </tr>
            </tbody>
        </table>
    @endif

    <div class="footer">
        <table class="footer-table">
            <tr>
                @include('pdf.partials.footer_qr_copyright')
                <td class="footer-cell">
                    @if(!empty($medimageLogo))<img src="{{ $medimageLogo }}" class="footer-logo" alt="">@endif
                </td>
                <td class="footer-cell">
                    @if(!empty($medhisLogo))<img src="{{ $medhisLogo }}" class="footer-logo" alt="">@endif
                </td>
                <td class="footer-cell">
                    @if(!empty($mediserLogo))<img src="{{ $mediserLogo }}" class="footer-logo" alt="">@endif
                </td>
                <td class="footer-cell">
                    @if(!empty($conexaLogo))<img src="{{ $conexaLogo }}" class="footer-logo" alt="">@endif
                </td>
                <td class="footer-cell">
                    @if(!empty($mksLogo))<img src="{{ $mksLogo }}" class="footer-logo" alt="">@endif
                </td>
            </tr>
        </table>
    </div>
</body>

</html>
