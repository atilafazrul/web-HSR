<table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse; margin: 0 auto;">
    @if(!empty($signature))
    <tr>
        <td align="center" style="text-align: center; padding: 0 0 2px 0;">
            <img src="{{ $signature }}" alt="Tanda Tangan" style="height: 50px; max-width: 200px; display: block; margin: 0 auto;" />
        </td>
    </tr>
    @endif
    <tr>
        <td align="center" style="text-align: center; padding: 0;">
            <div style="border-top: 1px solid #000; padding-top: 3px; min-width: 180px; font-size: 11px;">
                ( {{ $name ?? '........................' }} )
            </div>
        </td>
    </tr>
</table>
