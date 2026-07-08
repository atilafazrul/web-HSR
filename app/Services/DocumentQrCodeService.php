<?php

namespace App\Services;

use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\PngWriter;

class DocumentQrCodeService
{
    public function toDataUri(?string $text): string
    {
        $text = trim((string) $text);
        if ($text === '') {
            return '';
        }

        $result = (new Builder(
            writer: new PngWriter(),
            data: $text,
            size: 90,
            margin: 1,
        ))->build();

        return $result->getDataUri();
    }
}
