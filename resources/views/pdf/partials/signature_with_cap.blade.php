@php
    $signature = $signature ?? null;
    $blankLines = (int) ($blankLines ?? 4);
    $merged = (bool) ($merged ?? false);
@endphp

@if(!empty($signature))
    <p class="MsoNormal" align="center" style="margin-bottom: 0in; line-height: normal; text-align: center;">
        <img
            src="{{ $signature }}"
            alt="Tanda Tangan"
            style="display: inline-block; margin: 0 auto; border: none; {{ $merged ? 'height: 72px; width: auto;' : 'height: 50px; max-width: 168px; width: auto;' }}"
        />
    </p>
@else
    @for ($i = 0; $i < $blankLines; $i++)
        <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
    @endfor
@endif
