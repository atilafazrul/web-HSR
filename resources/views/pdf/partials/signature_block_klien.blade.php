@if(!empty($ttd_klien) || !empty($nama_ttd_klien))
                    <table border="0" cellspacing="0" cellpadding="0" align="right" style="border-collapse: collapse;">
                        @if(!empty($ttd_klien))
                        <tr>
                            <td align="center" style="text-align: center; padding: 0;">
                                <img src="{{ $ttd_klien }}" alt="Tanda Tangan Klien" style="height: 62px; max-width: 240px; display: block; margin: 0 auto;" />
                            </td>
                        </tr>
                        @endif
                        <tr>
                            <td align="center" style="text-align: center; padding: 0;">
                                <p class="MsoNormal" align="center" style="margin-bottom: 0in; text-align: center; line-height: normal">
                                    <span lang="EN-ID">@include('pdf.partials.signature_paren', ['name' => $nama_ttd_klien ?? null])</span>
                                </p>
                            </td>
                        </tr>
                    </table>
                    @else
                    <p class="MsoNormal" align="center" style="margin-bottom: 0in; text-align: center; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" align="center" style="margin-bottom: 0in; text-align: center; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" align="right" style="margin-bottom: 0in; text-align: right; line-height: normal">
                        <span lang="EN-ID">@include('pdf.partials.signature_paren', ['name' => $nama_ttd_klien ?? null])</span>
                    </p>
                    @endif
