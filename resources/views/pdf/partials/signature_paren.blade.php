@php
    $displayName = trim($name ?? '');
@endphp
<table border="0" cellspacing="0" cellpadding="0" align="center" style="border-collapse: collapse;">
    <tr>
        <td style="padding: 0; vertical-align: bottom; white-space: nowrap;">(</td>
        <td style="width: 200px; min-width: 200px; text-align: center; padding: 0 4px; vertical-align: bottom;">
            @if($displayName !== '')
                {{ $displayName }}
            @else
                &nbsp;
            @endif
        </td>
        <td style="padding: 0; vertical-align: bottom; white-space: nowrap;">)</td>
    </tr>
</table>
