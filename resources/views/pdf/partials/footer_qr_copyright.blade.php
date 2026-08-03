@if(!empty($qrCode))
    <td class="footer-cell footer-qr-cell">
        <img src="{{ $qrCode }}" class="footer-qr" alt="QR {{ $nomor_surat ?? '' }}">
        <div class="footer-copyright-text">Copyright by PT.HSR</div>
    </td>
@endif
