@php
    $lines = preg_split("/\r\n|\r|\n/", (string) ($text ?? ''));
    $lines = array_values(array_filter(array_map('trim', $lines), fn ($line) => $line !== ''));
@endphp
@if(count($lines) > 0)
{!! implode('<br>', array_map('e', $lines)) !!}
@endif
