<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <style>
        @page {
            size: 595.3pt 841.9pt;
            margin: 0.45in 0.55in 0.5in 0.55in;
        }

        body {
            font-family: Georgia, "Times New Roman", "Times-Roman", Times, serif;
            font-size: 10pt;
            color: #000;
            line-height: 1.35;
            margin: 0;
            padding: 0;
        }

        table { border-collapse: collapse; }
        p { margin: 0; }

        .bar-top,
        .bar-bottom { background: #9999FF; width: 100%; }

        .bar-top { height: 70px; }
        .bar-bottom { height: 22px; }

        .bar-top-inner { width: 100%; height: 70px; }
        .bar-top-inner td { vertical-align: middle; padding: 8px 10px; }

        .logo-hsr { height: 56px; width: auto; max-width: 240px; display: block; }
        .logo-iso { height: 48px; width: auto; max-width: 52px; display: block; margin-left: auto; background: #fff; padding: 2px; }

        .header-body { width: 100%; margin-top: 10px; margin-bottom: 16px; }
        .header-body td { vertical-align: top; }

        .company-name { font-weight: bold; font-size: 10pt; margin-bottom: 4px; }
        .company-meta { font-size: 8.4pt; line-height: 1.35; }

        .invoice-title {
            font-weight: bold;
            font-size: 36pt;
            text-align: right;
            line-height: 1;
            padding-top: 6px;
        }

        .info-table { width: 100%; margin-bottom: 12px; }
        .info-table > tbody > tr > td { vertical-align: top; }

        .bill-label { font-weight: bold; font-size: 10pt; margin-bottom: 8px; }
        .bill-name { font-weight: bold; font-size: 8.4pt; margin-bottom: 3px; }
        .bill-detail { font-size: 8.4pt; line-height: 1.35; }

        .meta-wrap { width: 100%; margin-top: 48px; }
        .meta-wrap td { padding: 2px 0; vertical-align: middle; }
        .meta-key {
            width: 105px;
            text-align: right;
            font-weight: bold;
            font-size: 10pt;
            padding-right: 8px;
            white-space: nowrap;
        }
        .meta-gap { width: 14px; }
        .meta-val {
            text-align: left;
            font-weight: normal;
            font-size: 8.4pt;
            white-space: nowrap;
            padding-left: 4px;
        }

        .items-table { width: 100%; margin-top: 6px; margin-bottom: 20px; border: none; }
        .items-table th {
            background: #CCCCFF;
            color: #000;
            font-size: 10pt;
            font-weight: bold;
            padding: 5px 6px;
            border: none;
        }
        .items-table td {
            font-size: 8.4pt;
            padding: 4px 6px;
            border: none;
            height: 16px;
            vertical-align: middle;
        }

        .row-odd td { background: #ffffff; }
        .row-even td { background: #f5f5f5; }
        .total-row td { font-weight: bold; }

        .col-item { width: 28%; }
        .col-unit { width: 10%; text-align: center; }
        .col-qty { width: 8%; text-align: center; }
        .col-price { width: 27%; }
        .col-amount { width: 27%; }

        .th-item { text-align: left; }
        .th-unit, .th-qty { text-align: center; }
        .th-price, .th-amount { text-align: center; }

        .money-table { width: 100%; border-collapse: collapse; }
        .money-table td {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            font-size: 8.4pt;
            height: auto !important;
        }
        .money-rp { text-align: left; width: 18px; white-space: nowrap; }
        .money-num { text-align: right; white-space: nowrap; }

        .total-label {
            text-align: center;
            font-weight: bold;
            font-size: 8.4pt;
            white-space: nowrap;
        }

        .bottom-table { width: 100%; margin-top: 4px; }
        .bottom-table td { vertical-align: top; }

        .note-label, .terms-label {
            font-weight: bold;
            font-size: 10pt;
            color: #3e3141;
            margin-bottom: 6px;
        }
        .note-body, .terms-body { font-size: 8.4pt; line-height: 1.35; min-height: 36px; }

        .sign-inner { width: 180px; margin-left: auto; margin-right: 4px; text-align: center; }
        .sign-company { font-weight: bold; font-size: 6.8pt; margin-bottom: 4px; }
        .sign-space { height: 70px; margin: 2px 0 6px 0; }
        .sign-space img { height: 66px; width: auto; max-width: 170px; display: block; margin: 0 auto; }
        .sign-name { font-weight: bold; font-size: 8.4pt; }
        .sign-title { font-size: 8.4pt; }

        .thanks-wrapper {
            margin-top: 14px;
            margin-bottom: 6px;
            text-align: right;
            padding-right: 6px;
        }

        .thanks-title {
            font-weight: bold;
            font-size: 8.4pt;
            margin-bottom: 3px;
        }

        .thanks-qr-block {
            display: inline-block;
            text-align: center;
        }

        .thanks-qr {
            height: 34px;
            width: 34px;
            display: block;
            margin: 0 auto 2px auto;
        }

        .thanks-copyright {
            font-size: 6pt;
            font-family: "Calibri", sans-serif;
            color: #333;
            white-space: nowrap;
        }

        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 380px;
            opacity: 0.2;
            z-index: -1;
        }
    </style>
</head>
<body>
    @if(!empty($watermark))
        <img src="{{ $watermark }}" class="watermark" alt="">
    @endif

    <div class="bar-top">
        <table class="bar-top-inner">
            <tr>
                <td style="width:78%;">
                    @if(!empty($hsrLogo))
                        <img src="{{ $hsrLogo }}" class="logo-hsr" alt="HSR">
                    @endif
                </td>
                <td style="width:22%; text-align:right;">
                    @if(!empty($isoLogo))
                        <img src="{{ $isoLogo }}" class="logo-iso" alt="ISO">
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <table class="header-body">
        <tr>
            <td style="width:55%;">
                <div class="company-name">PT HAYATI SEMESTA RAHARJA</div>
                <div class="company-meta">
                    Jl. Raya pasar kemis Kp. Picung<br>
                    Rt004/005 Pasar kemis<br>
                    Kab.Tangerang, Banten 15560<br>
                    08999-222-69<br>
                    www.pthsr.id<br>
                    halo@pthsr.id
                </div>
            </td>
            <td style="width:45%;">
                <div class="invoice-title">INVOICE</div>
            </td>
        </tr>
    </table>

    <table class="info-table">
        <tr>
            <td style="width:50%; padding-right:10px;">
                <div class="bill-label">BILL TO</div>
                <div class="bill-name">{{ $bill_to_nama }}</div>
                <div class="bill-detail">
                    @if(!empty($bill_to_alamat))
                        {!! $bill_to_alamat !!}
                    @endif
                    @if(!empty($bill_to_telepon))
                        {{ $bill_to_telepon }}
                    @endif
                </div>
            </td>
            <td style="width:50%;">
                <table class="meta-wrap">
                    <tr>
                        <td class="meta-key">INVOICE NO.</td>
                        <td class="meta-gap">&nbsp;</td>
                        <td class="meta-val">{{ $nomor_surat }}</td>
                    </tr>
                    <tr>
                        <td class="meta-key">DATE</td>
                        <td class="meta-gap">&nbsp;</td>
                        <td class="meta-val">{{ $tanggal_invoice }}</td>
                    </tr>
                    <tr>
                        <td class="meta-key">DUE DATE</td>
                        <td class="meta-gap">&nbsp;</td>
                        <td class="meta-val">{{ filled($tanggal_jatuh_tempo ?? null) ? $tanggal_jatuh_tempo : '—' }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    @php
        $itemRows = $items ?? [];
        $hasDiskon = !empty($diskon_nominal);
        $afterTotalPads = 2;
        $ppnPersenLabel = rtrim(rtrim(number_format((float) ($ppn_persen ?? 11), 2, ',', '.'), '0'), ',');
        $rowIndex = 0;
    @endphp

    <table class="items-table">
        <thead>
            <tr>
                <th class="col-item th-item">ITEM NAME</th>
                <th class="col-unit th-unit">UNIT</th>
                <th class="col-qty th-qty">QTY</th>
                <th class="col-price th-price">PRICE</th>
                <th class="col-amount th-amount">AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            @foreach($itemRows as $item)
                <tr class="{{ $rowIndex % 2 === 0 ? 'row-odd' : 'row-even' }}">
                    <td class="col-item">{{ $item['nama_item'] ?? '-' }}</td>
                    <td class="col-unit">{{ $item['unit'] ?? 'pcs' }}</td>
                    <td class="col-qty">{{ $item['qty'] ?? 1 }}</td>
                    <td class="col-price">
                        <table class="money-table">
                            <tr>
                                <td class="money-rp">Rp</td>
                                <td class="money-num">{{ $item['harga_number'] ?? '' }}</td>
                            </tr>
                        </table>
                    </td>
                    <td class="col-amount">
                        <table class="money-table">
                            <tr>
                                <td class="money-rp">Rp</td>
                                <td class="money-num">{{ $item['amount_number'] ?? '' }}</td>
                            </tr>
                        </table>
                    </td>
                </tr>
                @php $rowIndex++; @endphp
            @endforeach

            {{-- satu baris kosong seperti contoh --}}
            <tr class="{{ $rowIndex % 2 === 0 ? 'row-odd' : 'row-even' }}">
                <td class="col-item">&nbsp;</td>
                <td class="col-unit">&nbsp;</td>
                <td class="col-qty">&nbsp;</td>
                <td class="col-price">&nbsp;</td>
                <td class="col-amount">&nbsp;</td>
            </tr>
            @php $rowIndex++; @endphp

            <tr class="total-row {{ $rowIndex % 2 === 0 ? 'row-odd' : 'row-even' }}">
                <td class="col-item">&nbsp;</td>
                <td class="col-unit total-label" colspan="2">SUBTOTAL</td>
                <td class="col-price">&nbsp;</td>
                <td class="col-amount">
                    <table class="money-table">
                        <tr>
                            <td class="money-rp"><strong>Rp</strong></td>
                            <td class="money-num"><strong>{{ $subtotal_number ?? '' }}</strong></td>
                        </tr>
                    </table>
                </td>
            </tr>
            @php $rowIndex++; @endphp

            @if($hasDiskon)
                <tr class="total-row {{ $rowIndex % 2 === 0 ? 'row-odd' : 'row-even' }}">
                    <td class="col-item">&nbsp;</td>
                    <td class="col-unit total-label" colspan="2">DISKON</td>
                    <td class="col-price">&nbsp;</td>
                    <td class="col-amount">
                        <table class="money-table">
                            <tr>
                                <td class="money-rp"><strong>Rp</strong></td>
                                <td class="money-num"><strong>- {{ $diskon_number ?? '' }}</strong></td>
                            </tr>
                        </table>
                    </td>
                </tr>
                @php $rowIndex++; @endphp
            @endif

            <tr class="total-row {{ $rowIndex % 2 === 0 ? 'row-odd' : 'row-even' }}">
                <td class="col-item">&nbsp;</td>
                <td class="col-unit total-label" colspan="2">PPN ({{ $ppnPersenLabel }}%)</td>
                <td class="col-price">&nbsp;</td>
                <td class="col-amount">
                    <table class="money-table">
                        <tr>
                            <td class="money-rp"><strong>Rp</strong></td>
                            <td class="money-num"><strong>{{ $ppn_number ?? '' }}</strong></td>
                        </tr>
                    </table>
                </td>
            </tr>
            @php $rowIndex++; @endphp

            <tr class="total-row {{ $rowIndex % 2 === 0 ? 'row-odd' : 'row-even' }}">
                <td class="col-item">&nbsp;</td>
                <td class="col-unit total-label" colspan="2">TOTAL</td>
                <td class="col-price">&nbsp;</td>
                <td class="col-amount">
                    <table class="money-table">
                        <tr>
                            <td class="money-rp"><strong>Rp</strong></td>
                            <td class="money-num"><strong>{{ $total_number ?? '' }}</strong></td>
                        </tr>
                    </table>
                </td>
            </tr>
            @php $rowIndex++; @endphp

            @for($i = 0; $i < $afterTotalPads; $i++)
                <tr class="{{ $rowIndex % 2 === 0 ? 'row-odd' : 'row-even' }}">
                    <td class="col-item">&nbsp;</td>
                    <td class="col-unit">&nbsp;</td>
                    <td class="col-qty">&nbsp;</td>
                    <td class="col-price">&nbsp;</td>
                    <td class="col-amount">&nbsp;</td>
                </tr>
                @php $rowIndex++; @endphp
            @endfor
        </tbody>
    </table>

    <table class="bottom-table">
        <tr>
            <td style="width:58%; padding-right:12px;">
                <div class="note-label">Note</div>
                <div class="note-body">{!! $catatan ?? '' !!}</div>
                <div class="terms-label" style="margin-top:28px;">TERMS</div>
                <div class="terms-body">{!! $terms ?? '' !!}</div>
            </td>
            <td style="width:42%;">
                <div class="sign-inner">
                    <div class="sign-company">PT. HAYATI SEMESTA RAHARJA</div>
                    <div class="sign-space">
                        @if(!empty($ttd_penandatangan))
                            <img src="{{ $ttd_penandatangan }}" alt="TTD">
                        @endif
                    </div>
                    <div class="sign-name">{{ strtoupper($nama_penandatangan ?? 'SYAHRUL ROJI') }}</div>
                    <div class="sign-title">{{ strtoupper($jabatan_penandatangan ?? 'DIREKTUR') }}</div>
                </div>
            </td>
        </tr>
    </table>

    <div class="thanks-wrapper">
        <div class="thanks-title">Thank you for your business!</div>
        @if(!empty($qrCode))
            <div class="thanks-qr-block">
                <img src="{{ $qrCode }}" class="thanks-qr" alt="QR {{ $nomor_surat ?? '' }}">
                <div class="thanks-copyright">Copyright by PT.HSR</div>
            </div>
        @else
            <div class="thanks-copyright">Copyright by PT.HSR</div>
        @endif
    </div>
    <div class="bar-bottom"></div>
</body>
</html>
