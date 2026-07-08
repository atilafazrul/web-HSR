<?php

namespace App\Services;

class BeritaAcaraPdfAssetService
{
    public function __construct(
        private readonly DocumentQrCodeService $qrCodeService,
    ) {
    }

    public function enrich(array $data): array
    {
        $assets = [
            'hsrLogo' => public_path('images/hsr logo.png'),
            'isoLogo' => public_path('images/iso logo.png'),
            'medimageLogo' => public_path('images/medimage logo.png'),
            'medhisLogo' => public_path('images/medhis.png'),
            'mediserLogo' => public_path('images/mediser logo.png'),
            'conexaLogo' => public_path('images/conexa.png'),
            'mksLogo' => public_path('images/mks logo.png'),
            'watermark' => public_path('images/LOGO HSR.png'),
        ];

        foreach ($assets as $key => $path) {
            $data[$key] = $this->encodeImage($path);
        }

        $data['qrCode'] = $this->qrCodeService->toDataUri($data['nomor_surat'] ?? null);

        return $data;
    }

    private function encodeImage(string $path): string
    {
        if (!file_exists($path)) {
            return '';
        }

        return 'data:image/png;base64,' . base64_encode(file_get_contents($path));
    }
}
