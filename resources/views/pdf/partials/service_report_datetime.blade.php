@php
    $dateValue = $date ?? null;
    $timeValue = trim($time ?? '');
    $formattedDate = $dateValue ? \Carbon\Carbon::parse($dateValue)->format('d-m-Y') : '';
@endphp
@if($formattedDate && $timeValue !== '')
    {{ $formattedDate }}<br>{{ $timeValue }}
@elseif($formattedDate)
    {{ $formattedDate }}
@elseif($timeValue !== '')
    {{ $timeValue }}
@else
    -
@endif
