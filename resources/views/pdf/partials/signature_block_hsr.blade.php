@if(!empty($ttd_hsr) || !empty($nama_ttd_hsr))
                    <table border="0" cellspacing="0" cellpadding="0" align="left" style="border-collapse: collapse;">
                        @if(!empty($ttd_hsr))
                        <tr>
                            <td align="center" style="text-align: center; padding: 0;">
                                <img src="{{ $ttd_hsr }}" alt="Tanda Tangan HSR" style="height: 62px; max-width: 240px; display: block; margin: 0 auto;" />
                            </td>
                        </tr>
                        @endif
                        <tr>
                            <td align="center" style="text-align: center; padding: 0;">
                                <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal">
                                    <span lang="EN-ID">@include('pdf.partials.signature_paren', ['name' => $nama_ttd_hsr ?? null])</span>
                                </p>
                            </td>
                        </tr>
                    </table>
                    @else
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal"><span lang="EN-ID">&nbsp;</span></p>
                    <p class="MsoNormal" style="margin-bottom: 0in; line-height: normal">
                        <span lang="EN-ID">@include('pdf.partials.signature_paren', ['name' => $nama_ttd_hsr ?? null])</span>
                    </p>
                    @endif
