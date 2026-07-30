/* Dompdf ignores object-fit / width:auto well — use fixed aspect ratios. */
        /* LOGO HSR.png is 831×315 (~2.64:1) */
        .header-logo-hsr {
            width: 135px;
            height: 51px;
            max-width: none;
            border: 0;
            display: block;
        }

        /* iso logo.png is ~square */
        .header-logo-iso {
            width: 58px;
            height: 58px;
            max-width: none;
            border: 0;
            display: block;
            margin-left: auto;
        }

        .logo-left {
            text-align: left;
            vertical-align: middle;
            padding-right: 10px;
            width: 24%;
        }

        .logo-right {
            text-align: right;
            vertical-align: middle;
            width: 16%;
        }

        .company-info {
            text-align: center;
            vertical-align: middle;
            width: 60%;
        }
