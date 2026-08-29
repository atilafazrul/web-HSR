<?php

namespace App\Services;

use App\Models\DashboardBiaya;
use DateTimeInterface;
use DateTimeImmutable;
use DateTimeZone;
use InvalidArgumentException;

class BiayaDuplicateValidator
{
    /** Validasi duplikat hanya berlaku mulai tanggal ini (Asia/Jakarta). Data sebelumnya tetap boleh sama. */
    public const ENFORCE_FROM_DATE = '2026-08-24';

    public static function timezone(): DateTimeZone
    {
        return new DateTimeZone(config('app.timezone', 'Asia/Jakarta'));
    }

    public static function isOnOrAfterEnforceDate(?string $value, ?DateTimeInterface $fallback = null): bool
    {
        $dateKey = self::normalizeDateKey($value, $fallback);
        if ($dateKey === '' || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateKey)) {
            return true;
        }

        return $dateKey >= self::ENFORCE_FROM_DATE;
    }

    public static function nowInAppTimezone(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', self::timezone());
    }

    /**
     * Kunci tanggal (Y-m-d) dari created_at; jam/menit diabaikan.
     */
    public static function normalizeDateKey(?string $value, ?DateTimeInterface $fallback = null): string
    {
        $raw = trim((string) ($value ?? ''));
        if ($raw === '' && $fallback !== null) {
            return DateTimeImmutable::createFromInterface($fallback)
                ->setTimezone(self::timezone())
                ->format('Y-m-d');
        }

        if ($raw === '') {
            return '';
        }

        try {
            return (new DateTimeImmutable($raw))
                ->setTimezone(self::timezone())
                ->format('Y-m-d');
        } catch (\Exception) {
            return mb_strtolower($raw);
        }
    }

    public static function formatDateForMessage(?string $value, ?DateTimeInterface $fallback = null): string
    {
        $raw = trim((string) ($value ?? ''));
        if ($raw === '' && $fallback !== null) {
            return DateTimeImmutable::createFromInterface($fallback)
                ->setTimezone(self::timezone())
                ->format('d/m/Y');
        }

        if ($raw === '') {
            return '-';
        }

        try {
            return (new DateTimeImmutable($raw))
                ->setTimezone(self::timezone())
                ->format('d/m/Y');
        } catch (\Exception) {
            return $raw;
        }
    }

    public static function kategoriLabel(string $kategori): string
    {
        return match ($kategori) {
            'jalan' => 'Biaya Jalan',
            'pengeluaran' => 'Biaya Pengeluaran',
            'reimbursment' => 'Biaya Reimbursment',
            default => $kategori,
        };
    }

    /**
     * Kunci bisnis duplikat: tanggal (hari) + nominal + keterangan.
     * Baris tanpa created_at memakai fallback (default: hari ini Asia/Jakarta).
     */
    public static function businessKeyForRow(array $row, ?DateTimeInterface $fallbackDate = null): ?string
    {
        $nominal = round((float) ($row['nominal'] ?? 0), 2);
        $keterangan = mb_strtolower(trim((string) ($row['keterangan'] ?? '')));

        if ($nominal <= 0 && $keterangan === '') {
            return null;
        }

        $createdAtRaw = trim((string) ($row['created_at'] ?? ''));
        $fallback = $createdAtRaw === ''
            ? ($fallbackDate ?? self::nowInAppTimezone())
            : null;

        $dateKey = self::normalizeDateKey($createdAtRaw !== '' ? $createdAtRaw : null, $fallback);
        if ($dateKey === '') {
            return null;
        }

        return $dateKey.'|'.$nominal.'|'.$keterangan;
    }

    protected static function buildDuplicateMessage(
        string $categoryLabel,
        string $tanggalDisplay,
        float $nominal,
        string $keteranganDisplay
    ): string {
        $nominalFormatted = number_format($nominal, 0, ',', '.');

        return "Duplikat {$categoryLabel}: tanggal {$tanggalDisplay}, nominal Rp {$nominalFormatted}, keterangan \"{$keteranganDisplay}\" sudah ada. Ubah tanggal, nominal, atau keterangan.";
    }

    /**
     * Validasi array biaya proyek (jalan/pengeluaran/reimbursment) sebelum disimpan.
     *
     * @param  array<int, array<string, mixed>>  $items
     */
    public static function assertNoDuplicatesInItemArray(array $items, string $categoryLabel): void
    {
        $seen = [];
        $fallback = self::nowInAppTimezone();

        foreach ($items as $row) {
            if (! is_array($row)) {
                continue;
            }

            $nominal = round((float) ($row['nominal'] ?? 0), 2);
            $keterangan = mb_strtolower(trim((string) ($row['keterangan'] ?? '')));
            $createdAtRaw = trim((string) ($row['created_at'] ?? ''));

            if ($nominal <= 0 && $keterangan === '') {
                continue;
            }

            $rowFallback = $createdAtRaw === '' ? $fallback : null;
            if (! self::isOnOrAfterEnforceDate($createdAtRaw !== '' ? $createdAtRaw : null, $rowFallback)) {
                continue;
            }

            $key = self::businessKeyForRow($row, $rowFallback);
            if ($key === null) {
                continue;
            }

            if (isset($seen[$key])) {
                throw new InvalidArgumentException(self::buildDuplicateMessage(
                    $categoryLabel,
                    self::formatDateForMessage($createdAtRaw !== '' ? $createdAtRaw : null, $rowFallback),
                    $nominal,
                    trim((string) ($row['keterangan'] ?? ''))
                ));
            }

            $seen[$key] = true;
        }
    }

    /**
     * Validasi biaya dashboard (di luar proyek) — bandingkan tanggal + nominal + keterangan per akun.
     *
     * @param  bool  $lockForUpdate  Wajib dipanggil di dalam DB::transaction() bila true.
     */
    public static function assertNoDuplicateDashboardRow(
        string $kategori,
        float $nominal,
        ?string $keterangan,
        int $createdBy,
        DateTimeInterface $referenceDate,
        ?int $excludeId = null,
        bool $lockForUpdate = false
    ): void {
        $nominal = round($nominal, 2);
        $keteranganNorm = mb_strtolower(trim((string) ($keterangan ?? '')));

        if ($nominal <= 0 && $keteranganNorm === '') {
            return;
        }

        if (! self::isOnOrAfterEnforceDate(null, $referenceDate)) {
            return;
        }

        $dateKey = self::normalizeDateKey(null, $referenceDate);
        $tz = self::timezone();
        $start = (new DateTimeImmutable($dateKey.' 00:00:00', $tz));
        $end = $start->modify('+1 day');

        $query = DashboardBiaya::query()
            ->where('created_by', $createdBy)
            ->where('kategori', $kategori)
            ->where('created_at', '>=', $start->format('Y-m-d H:i:s'))
            ->where('created_at', '<', $end->format('Y-m-d H:i:s'));

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        foreach ($query->get() as $existing) {
            $existingNominal = round((float) ($existing->nominal ?? 0), 2);
            $existingKeterangan = mb_strtolower(trim((string) ($existing->keterangan ?? '')));

            if ($existingNominal === $nominal && $existingKeterangan === $keteranganNorm) {
                throw new InvalidArgumentException(self::buildDuplicateMessage(
                    self::kategoriLabel($kategori),
                    self::formatDateForMessage(null, $referenceDate),
                    $nominal,
                    trim((string) ($keterangan ?? ''))
                ));
            }
        }
    }
}
