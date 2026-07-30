/* Dompdf ignores object-fit / width:auto — use fixed aspect ratios + valign attrs. */
        /* LOGO HSR.png is 831×315 (~2.64:1) */
        .header-logo-hsr {
            width: 128px;
            height: 48px;
            max-width: none;
            border: 0;
            display: inline-block;
            vertical-align: middle;
        }

        /* iso logo.png is 156×158 (~1:1) */
        .header-logo-iso {
            width: 56px;
            height: 57px;
            max-width: none;
            border: 0;
            display: inline-block;
            vertical-align: middle;
        }

        .logo-left {
            text-align: left;
            vertical-align: middle;
            padding: 0 8px 2px 0;
            width: 20%;
        }

        .logo-right {
            text-align: right;
            vertical-align: middle;
            padding: 0 0 2px 8px;
            width: 16%;
        }

        .company-info {
            text-align: center;
            vertical-align: middle;
            width: 64%;
            padding: 0 4px 2px 4px;
        }

        .company-name {
            font-family: "Times-Roman", "Times New Roman", Times, serif;
            font-size: 15pt;
            font-weight: bold;
            margin: 0 0 2px 0;
            letter-spacing: 0.4px;
            line-height: 1.15;
            color: #000;
        }

        .address-info {
            font-family: "Times-Roman", "Times New Roman", Times, serif;
            font-size: 9pt;
            line-height: 1.3;
            color: #000;
        }

        .header-link {
            color: #0000EE;
            text-decoration: underline;
        }
