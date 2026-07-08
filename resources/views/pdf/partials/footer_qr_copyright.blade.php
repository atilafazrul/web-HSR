@if(!empty($qrCode))
    <div class="pdf-qr-copyright">
        <img src="{{ $qrCode }}" alt="QR {{ $nomor_surat ?? '' }}">
        <div class="pdf-copyright-text">Copyright by PT.HSR</div>
    </div>
@endif
