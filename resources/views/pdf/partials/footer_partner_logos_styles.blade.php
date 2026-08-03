        /* FOOTER - QR + Partner logos, satu baris rapi di bagian bawah */
        .footer {
            position: fixed;
            /* Slightly lower so it sits closer to page edge */
            bottom: -6px;
            left: 20pt;
            right: 20pt;
            text-align: center;
            padding-top: 0;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
            /* Kolom otomatis terbagi rata, baik 5 kolom (logo saja) atau 6 (QR + logo) */
            table-layout: fixed;
        }

        .footer-logo {
            /* Skala proporsional: batasi tinggi & lebar, jangan pernah gepeng/kurus */
            max-height: 42px;
            max-width: 100%;
            width: auto;
            height: auto;
            display: block;
            margin: 0 auto;
        }

        .footer-cell {
            text-align: center;
            vertical-align: middle;
            padding: 0 3px;
        }
