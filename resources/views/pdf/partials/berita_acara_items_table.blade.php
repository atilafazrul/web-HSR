<table class="MsoTableGrid" border="1" cellspacing="0" cellpadding="0"
    style="width: 100%; border-collapse: collapse;">
    <tr style="height: 3.55pt">
        <td width="56" valign="middle"
            style="width: 41.85pt; border: solid windowtext 1.0pt; padding: 4pt 5.4pt; height: 3.55pt; text-align: center; vertical-align: middle;">
            <p class="MsoNormal" align="center"
                style="margin-bottom: 0in; text-align: center; line-height: normal">
                <span lang="EN-ID">NO</span>
            </p>
        </td>

        <td width="327" valign="middle"
            style="width: 244.9pt; border: solid windowtext 1.0pt; border-left: none; padding: 4pt 5.4pt; height: 3.55pt; text-align: center; vertical-align: middle;">
            <p class="MsoNormal" align="center"
                style="margin-bottom: 0in; text-align: center; line-height: normal">
                <span lang="EN-ID">ITEM</span>
            </p>
        </td>

        <td width="135" valign="middle"
            style="width: 101.25pt; border: solid windowtext 1.0pt; border-left: none; padding: 4pt 5.4pt; height: 3.55pt; text-align: center; vertical-align: middle;">
            <p class="MsoNormal" align="center"
                style="margin-bottom: 0in; text-align: center; line-height: normal">
                <span lang="EN-ID">MEREK</span>
            </p>
        </td>

        <td width="135" valign="middle"
            style="width: 101.25pt; border: solid windowtext 1.0pt; border-left: none; padding: 4pt 5.4pt; height: 3.55pt; text-align: center; vertical-align: middle;">
            <p class="MsoNormal" align="center"
                style="margin-bottom: 0in; text-align: center; line-height: normal">
                <span lang="EN-ID">JUMLAH</span>
            </p>
        </td>
    </tr>

    @if(isset($items) && count($items) > 0)
        @foreach($items as $index => $item)
            <tr style="height: 28.45pt">
                <td width="56" valign="middle"
                    style="width: 41.85pt; border: solid windowtext 1.0pt; border-top: none; padding: 4pt 5.4pt; height: 28.45pt; text-align: center; vertical-align: middle;">
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal">
                        <span lang="EN-ID">{{ $index + 1 }}</span>
                    </p>
                </td>
                <td width="327" valign="middle"
                    style="width: 244.9pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 4pt 5.4pt; height: 28.45pt; text-align: left; vertical-align: middle;">
                    <p class="MsoNormal" align="left"
                        style="margin-bottom: 0in; text-align: left; line-height: normal">
                        <span lang="EN-ID">{{ $item['nama_alat'] ?? '-' }}</span>
                    </p>
                </td>
                <td width="135" valign="middle"
                    style="width: 101.25pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 4pt 5.4pt; height: 28.45pt; text-align: center; vertical-align: middle;">
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal">
                        <span lang="EN-ID">{{ $item['merk'] ?? '-' }}</span>
                    </p>
                </td>
                <td width="135" valign="middle"
                    style="width: 101.25pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 4pt 5.4pt; height: 28.45pt; text-align: center; vertical-align: middle;">
                    <p class="MsoNormal" align="center"
                        style="margin-bottom: 0in; text-align: center; line-height: normal">
                        <span lang="EN-ID">{{ $item['jumlah'] ?? '-' }}</span>
                    </p>
                </td>
            </tr>
        @endforeach
    @else
        <tr style="height: 28.45pt">
            <td width="56" valign="middle"
                style="width: 41.85pt; border: solid windowtext 1.0pt; border-top: none; padding: 4pt 5.4pt; height: 28.45pt; text-align: center; vertical-align: middle;">
                <p class="MsoNormal" align="center"
                    style="margin-bottom: 0in; text-align: center; line-height: normal">
                    <span lang="EN-ID">1</span>
                </p>
            </td>
            <td width="327" valign="middle"
                style="width: 244.9pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 4pt 5.4pt; height: 28.45pt; text-align: left; vertical-align: middle;">
                <p class="MsoNormal" align="left"
                    style="margin-bottom: 0in; text-align: left; line-height: normal">
                    <span lang="EN-ID">C - ARM</span>
                </p>
            </td>
            <td width="135" valign="middle"
                style="width: 101.25pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 4pt 5.4pt; height: 28.45pt; text-align: center; vertical-align: middle;">
                <p class="MsoNormal" align="center"
                    style="margin-bottom: 0in; text-align: center; line-height: normal">
                    <span lang="EN-ID">Siemens</span>
                </p>
            </td>
            <td width="135" valign="middle"
                style="width: 101.25pt; border-top: none; border-left: none; border-bottom: solid windowtext 1.0pt; border-right: solid windowtext 1.0pt; padding: 4pt 5.4pt; height: 28.45pt; text-align: center; vertical-align: middle;">
                <p class="MsoNormal" align="center"
                    style="margin-bottom: 0in; text-align: center; line-height: normal">
                    <span lang="EN-ID">1</span>
                </p>
            </td>
        </tr>
    @endif
</table>
