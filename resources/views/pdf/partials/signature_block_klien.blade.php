<table border="0" cellspacing="0" cellpadding="0" style="width: 200px; margin: 0 0 0 auto; border-collapse: collapse;">
    <tr>
        <td align="center" style="height: 62px; padding: 0; text-align: center; vertical-align: bottom;">
            @if(!empty($ttd_klien))
                <img src="{{ $ttd_klien }}" alt="Tanda Tangan Klien" style="height: 62px; max-width: 200px; display: block; margin: 0 auto;" />
            @else
                <span style="display: block; height: 62px;">&nbsp;</span>
            @endif
        </td>
    </tr>
    <tr>
        <td align="center" style="padding: 0; text-align: center;">
            @include('pdf.partials.signature_paren', ['name' => $nama_ttd_klien ?? null, 'align' => 'center'])
        </td>
    </tr>
</table>
