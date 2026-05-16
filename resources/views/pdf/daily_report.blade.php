<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 10mm 8mm 12mm 8mm; }
        * { box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 7.5pt; color: #000; margin: 0; padding: 0; }
        table { width: 100%; border-collapse: collapse; }
        td, th { border: 1px solid #000; padding: 3px 4px; vertical-align: middle; }
        .no-border td { border: none; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .title-yellow { background: #ffff00; font-weight: bold; font-size: 11pt; text-align: center; padding: 5px; color: #c00000; }
        .header-logo-row td {
            height: 64px;
            padding: 5px 6px;
            vertical-align: middle;
        }
        .logo-cell,
        .hse-logo-cell {
            width: 18%;
            text-align: center;
        }
        .header-logo {
            height: 50px;
            width: auto;
            max-width: 100%;
        }
        .project-cell { text-align: center; font-size: 8pt; line-height: 1.35; padding: 8px 10px; vertical-align: middle; }
        .meta-label { font-weight: bold; font-size: 7pt; }
        .meta-value { font-size: 7pt; text-align: center; }
        .section-h { background: #f0f0f0; font-weight: bold; text-align: center; font-size: 8pt; }
        .sub-h { font-weight: bold; text-align: center; font-size: 7pt; background: #fafafa; }
        .check { text-align: center; font-size: 9pt; }
        .notes-box { min-height: 70px; white-space: pre-wrap; vertical-align: top; padding: 6px; }
        .signature-section { width: 100%; margin-top: 14px; border: none; }
        .signature-section td { border: none; text-align: center; vertical-align: top; width: 33%; padding: 6px 10px; }
        .sign-label { font-size: 8pt; margin-bottom: 2px; }
        .sign-space { height: 52px; line-height: 52px; font-size: 1px; }
        .sign-line-inner { border-top: 1px solid #000; width: 72%; margin: 0 auto; }
        .sign-name { font-weight: bold; font-size: 8pt; margin-top: 8px; }
        .sign-sub { font-size: 7pt; margin-top: 3px; }
        .small { font-size: 6.5pt; }
    </style>
</head>
<body>

<table>
    <colgroup>
        <col style="width:18%">
        <col style="width:32%">
        <col style="width:32%">
        <col style="width:18%">
    </colgroup>
    <tr class="header-logo-row">
        <td class="logo-cell">
            @if(!empty($logo_base64))
                <img src="{{ $logo_base64 }}" alt="HSR" class="header-logo">
            @else
                <strong>HSR</strong><br><span class="small">HAYATI SEMESTA RAHARJA</span>
            @endif
        </td>
        <td colspan="2" class="project-cell">
            <strong>NAMA PEKERJAAN :</strong><br>
            {{ $nama_pekerjaan ?? '' }}
        </td>
        <td class="hse-logo-cell">
            @if(!empty($logo_hse_base64))
                <img src="{{ $logo_hse_base64 }}" alt="HSE K3" class="header-logo">
            @endif
        </td>
    </tr>
    <tr>
        <td colspan="4" class="title-yellow">HSE DAILY REPORT</td>
    </tr>
    <tr>
        <td class="meta-label">Document No.</td>
        <td class="meta-label">Rev.</td>
        <td></td>
        <td class="meta-label">Page</td>
    </tr>
    <tr>
        <td class="meta-value">{{ $document_no ?? 'DR-01-HSE 026' }}</td>
        <td class="meta-value">{{ $rev ?? '-' }}</td>
        <td></td>
        <td class="meta-value">{{ $page ?? '1-3' }}</td>
    </tr>
    <tr>
        <td class="bold">HARI / TANGGAL</td>
        <td>{{ $hari_tanggal ?? '' }}</td>
        <td class="bold">Jam Kerja Hari ini</td>
        <td>{{ $jam_kerja_hari ?? '' }}</td>
    </tr>
    <tr>
        <td class="bold">AREA / LOKASI</td>
        <td>{{ $area_lokasi ?? '' }}</td>
        <td class="bold">Jam Kerja Kumulatif</td>
        <td>{{ $jam_kerja_kumulatif ?? '' }}</td>
    </tr>
    <tr>
        <td class="bold">KEGIATAN</td>
        <td colspan="3">{{ $kegiatan ?? '' }}</td>
    </tr>
</table>

<table style="margin-top:4px;">
    <tr><td colspan="7" class="section-h">INFORMASI KEGIATAN</td></tr>
    <tr class="sub-h">
        <td rowspan="2" style="width:5%">No.</td>
        <td rowspan="2" style="width:22%">LOKASI</td>
        <td colspan="2">DESKRIPSI</td>
        <td colspan="3">DESKRIPSI</td>
    </tr>
    <tr class="sub-h">
        <td>PEKERJA<br>(MAN POWER)</td>
        <td>JAM KERJA<br>(MAN HOUR)</td>
        <td>TOTAL JAM KERJA</td>
        <td>TOTAL KESELURUHAN<br>JAM KERJA</td>
        <td>KETERANGAN</td>
    </tr>
    @php $no = 1; @endphp
    @foreach($informasi_kegiatan ?? [] as $row)
        @if(!empty($row['lokasi']) || !empty($row['pekerja']))
        <tr>
            <td class="center">{{ $no++ }}</td>
            <td>{{ $row['lokasi'] ?? '' }}</td>
            <td class="center">{{ $row['pekerja'] ?? '' }}</td>
            <td class="center">{{ $row['jam_kerja'] ?? '' }}</td>
            <td class="center">{{ $row['total_jam_kerja'] ?? '' }}</td>
            <td class="center">{{ $row['total_keseluruhan'] ?? '' }}</td>
            <td>{{ $row['keterangan'] ?? '' }}</td>
        </tr>
        @endif
    @endforeach
    <tr class="bold">
        <td></td>
        <td>OVERTIME</td>
        <td class="center">{{ $overtime['pekerja'] ?? '' }}</td>
        <td class="center">{{ $overtime['jam_kerja'] ?? '' }}</td>
        <td class="center">{{ $overtime['total_jam_kerja'] ?? '' }}</td>
        <td class="center">{{ $overtime['total_keseluruhan'] ?? '' }}</td>
        <td>{{ $overtime['keterangan'] ?? '' }}</td>
    </tr>
    <tr class="bold">
        <td colspan="5" class="center">TOTAL</td>
        <td class="center">{{ $total_keseluruhan_jam ?? '' }}</td>
        <td></td>
    </tr>
</table>

<table style="margin-top:4px;">
    <tr class="sub-h">
        <td colspan="5">KINERJA HSE</td>
        <td colspan="4">CATATAN PERALATAN, KONDISI CUACA</td>
    </tr>
    <tr class="sub-h small">
        <td style="width:4%">NO.</td>
        <td style="width:26%">PENJELASAN</td>
        <td style="width:5%">TIDAK</td>
        <td style="width:5%">YA</td>
        <td style="width:10%">KET.</td>
        <td style="width:22%">JENIS PERALATAN</td>
        <td style="width:6%">JML</td>
        <td style="width:12%">WAKTU</td>
        <td style="width:10%">KONDISI</td>
    </tr>
    @php
        $kinerjaList = $kinerja_hse ?? [];
        $peralatanList = $peralatan ?? [];
        $rowCount = max(count($kinerjaList), count($peralatanList), 15);
    @endphp
    @for($i = 0; $i < $rowCount; $i++)
        @php
            $k = $kinerjaList[$i] ?? ['no' => $i + 1, 'penjelasan' => '', 'tidak' => false, 'ya' => false, 'keterangan' => ''];
            $p = $peralatanList[$i] ?? ['jenis' => '', 'jumlah' => '', 'waktu' => '', 'kondisi' => ''];
            $noK = (int) ($k['no'] ?? ($i + 1));
        @endphp
        <tr>
            <td class="center">{{ $noK }}</td>
            <td>{{ $k['penjelasan'] ?? '' }}</td>
            @if($noK === 14)
                <td class="check">-</td>
                <td class="check">-</td>
                <td class="small">(cantumkan dalam kolom catatan)</td>
                <td colspan="3" class="center bold">KONDISI CUACA</td>
                <td></td>
            @elseif($noK === 15)
                <td class="check">-</td>
                <td class="check">-</td>
                <td class="small">Dari : {{ $jam_kerja_range ?? '08:00-16:00 WIB' }}</td>
                <td colspan="4" class="small">
                    @foreach($kondisi_cuaca_legend ?? [] as $code => $label)
                        <strong>{{ $code }}</strong> : {{ $label }}&nbsp;&nbsp;
                    @endforeach
                </td>
            @else
                <td class="check">{!! !empty($k['tidak']) ? '&#10003;' : '' !!}</td>
                <td class="check">{!! !empty($k['ya']) ? '&#10003;' : '' !!}</td>
                <td class="small">{{ $k['keterangan'] ?? '' }}</td>
                <td>{{ $p['jenis'] ?? '' }}</td>
                <td class="center">{{ $p['jumlah'] ?? '' }}</td>
                <td class="center small">{{ $p['waktu'] ?? '' }}</td>
                <td class="center">{{ $p['kondisi'] ?? '' }}</td>
            @endif
        </tr>
    @endfor
</table>

<table style="margin-top:6px;">
    <tr><td class="center bold" style="text-decoration:underline;">CATATAN DAN REKOMENDASI</td></tr>
    <tr><td class="notes-box">{{ $catatan_rekomendasi ?? '' }}</td></tr>
</table>

<table class="signature-section">
    <tr>
        <td>
            <div class="sign-label">Prepare by,</div>
            <div class="sign-space">&nbsp;</div>
            <div class="sign-line-inner"></div>
            <div class="sign-name">({{ $prepare_jabatan ?? 'HSE OFFICER' }})</div>
            @if(!empty($prepare_by))<div class="sign-sub">{{ $prepare_by }}</div>@endif
        </td>
        <td>
            <div class="sign-label">Checked by,</div>
            <div class="sign-space">&nbsp;</div>
            <div class="sign-line-inner"></div>
            <div class="sign-name">({{ $checked_by ?? 'LATIF SUHENDRO' }})</div>
        </td>
        <td>
            <div class="sign-label">Approved by,</div>
            <div class="sign-space">&nbsp;</div>
            <div class="sign-line-inner"></div>
            <div class="sign-name">({{ $approved_by ?? 'NANDA AFRIANSYAH' }})</div>
        </td>
    </tr>
</table>

</body>
</html>

