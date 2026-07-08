@php
    $displayName = trim($name ?? '');
@endphp
<table border="0" cellspacing="0" cellpadding="0" style="width: 100%; border-collapse: collapse;">
    <tr>
        <td style="padding: 0; vertical-align: bottom; white-space: nowrap;">(</td>
        <td style="width: 184px; text-align: center; padding: 0 4px; vertical-align: bottom;">
            @if($displayName !== '')
                {{ $displayName }}
            @else
                &nbsp;
            @endif
        </td>
        <td style="padding: 0; vertical-align: bottom; white-space: nowrap;">)</td>
    </tr>
</table>
