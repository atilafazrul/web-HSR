<?php

namespace App\Services;

class SignatureStampMerger
{
    public function normalizeSignature(?string $signatureDataUrl, int $maxWidth = 168, int $maxHeight = 50): ?string
    {
        if (empty($signatureDataUrl) || !function_exists('imagecreatefromstring')) {
            return $signatureDataUrl;
        }

        $sigBinary = $this->decodeDataUrl($signatureDataUrl);
        if ($sigBinary === '') {
            return $signatureDataUrl;
        }

        $sigImg = @imagecreatefromstring($sigBinary);
        if ($sigImg === false) {
            return $signatureDataUrl;
        }

        $srcW = imagesx($sigImg);
        $srcH = imagesy($sigImg);
        if ($srcW <= 0 || $srcH <= 0) {
            imagedestroy($sigImg);

            return $signatureDataUrl;
        }

        $scale = min($maxWidth / $srcW, $maxHeight / $srcH, 1);
        $targetW = max(1, (int) round($srcW * $scale));
        $targetH = max(1, (int) round($srcH * $scale));

        $canvas = imagecreatetruecolor($targetW, $targetH);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefill($canvas, 0, 0, $transparent);
        imagealphablending($canvas, true);

        imagecopyresampled($canvas, $sigImg, 0, 0, 0, 0, $targetW, $targetH, $srcW, $srcH);
        imagedestroy($sigImg);

        return $this->encodeImage($canvas);
    }

    public function merge(?string $signatureDataUrl, string $capDataUrl, int $canvasWidth = 240, int $canvasHeight = 88): ?string
    {
        if (!function_exists('imagecreatefromstring')) {
            return $signatureDataUrl ?: $capDataUrl;
        }

        $capBinary = $this->decodeDataUrl($capDataUrl);
        if ($capBinary === '') {
            return $signatureDataUrl;
        }

        $capImg = @imagecreatefromstring($capBinary);
        if ($capImg === false) {
            return $signatureDataUrl ?: $capDataUrl;
        }

        $canvas = imagecreatetruecolor($canvasWidth, $canvasHeight);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
        imagefill($canvas, 0, 0, $transparent);
        imagealphablending($canvas, true);

        if (!empty($signatureDataUrl)) {
            $sigBinary = $this->decodeDataUrl($signatureDataUrl);
            if ($sigBinary !== '') {
                $sigImg = @imagecreatefromstring($sigBinary);
                if ($sigImg !== false) {
                    $this->drawResizedImage($canvas, $sigImg, 168, 50, $canvasWidth, $canvasHeight, 6);
                    imagedestroy($sigImg);
                }
            }
        }

        $this->drawResizedImage($canvas, $capImg, 210, 78, $canvasWidth, $canvasHeight, 0);
        imagedestroy($capImg);

        $cropped = $this->cropTransparent($canvas);
        if ($cropped !== false) {
            imagedestroy($canvas);
            $canvas = $cropped;
        }

        return $this->encodeImage($canvas);
    }

    private function drawResizedImage(
        $canvas,
        $source,
        int $maxWidth,
        int $maxHeight,
        int $canvasWidth,
        int $canvasHeight,
        int $verticalOffset = 0
    ): void {
        $srcW = imagesx($source);
        $srcH = imagesy($source);

        if ($srcW <= 0 || $srcH <= 0) {
            return;
        }

        $scale = min($maxWidth / $srcW, $maxHeight / $srcH);
        $targetW = max(1, (int) round($srcW * $scale));
        $targetH = max(1, (int) round($srcH * $scale));
        $destX = (int) (($canvasWidth - $targetW) / 2);
        $destY = (int) (($canvasHeight - $targetH) / 2) + $verticalOffset;

        imagealphablending($canvas, true);
        imagesavealpha($canvas, true);
        imagecopyresampled(
            $canvas,
            $source,
            $destX,
            $destY,
            0,
            0,
            $targetW,
            $targetH,
            $srcW,
            $srcH
        );
    }

    private function cropTransparent($image)
    {
        $width = imagesx($image);
        $height = imagesy($image);

        if ($width <= 0 || $height <= 0) {
            return false;
        }

        $minX = $width;
        $minY = $height;
        $maxX = 0;
        $maxY = 0;

        for ($y = 0; $y < $height; $y++) {
            for ($x = 0; $x < $width; $x++) {
                $rgba = imagecolorat($image, $x, $y);
                $alpha = ($rgba & 0x7F000000) >> 24;

                if ($alpha < 120) {
                    $minX = min($minX, $x);
                    $minY = min($minY, $y);
                    $maxX = max($maxX, $x);
                    $maxY = max($maxY, $y);
                }
            }
        }

        if ($maxX <= $minX || $maxY <= $minY) {
            return false;
        }

        $cropW = $maxX - $minX + 1;
        $cropH = $maxY - $minY + 1;

        $cropped = imagecreatetruecolor($cropW, $cropH);
        imagealphablending($cropped, false);
        imagesavealpha($cropped, true);
        $transparent = imagecolorallocatealpha($cropped, 0, 0, 0, 127);
        imagefill($cropped, 0, 0, $transparent);
        imagealphablending($cropped, true);

        imagecopy($cropped, $image, 0, 0, $minX, $minY, $cropW, $cropH);

        return $cropped;
    }

    private function encodeImage($image): ?string
    {
        ob_start();
        imagepng($image);
        $pngData = ob_get_clean();
        imagedestroy($image);

        if ($pngData === false || $pngData === '') {
            return null;
        }

        return 'data:image/png;base64,' . base64_encode($pngData);
    }

    private function decodeDataUrl(string $dataUrl): string
    {
        if (preg_match('/^data:image\/[\w+.-]+;base64,(.+)$/s', $dataUrl, $matches)) {
            $decoded = base64_decode($matches[1], true);

            return $decoded !== false ? $decoded : '';
        }

        $decoded = base64_decode($dataUrl, true);

        return $decoded !== false ? $decoded : '';
    }
}
