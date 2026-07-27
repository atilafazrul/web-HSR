<?php

namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonInterface;

class ScheduleRecurrence
{
    public const TYPE_ONCE = 'once';
    public const TYPE_DAILY = 'daily';
    public const TYPE_WEEKLY = 'weekly';
    public const TYPE_MONTHLY = 'monthly';

    /**
     * @return string[]
     */
    public static function types(): array
    {
        return [
            self::TYPE_ONCE,
            self::TYPE_DAILY,
            self::TYPE_WEEKLY,
            self::TYPE_MONTHLY,
        ];
    }

    public static function nextRunAt(
        CarbonInterface $from,
        string $recurrenceType,
        ?CarbonInterface $recurrenceEndAt = null
    ): ?Carbon {
        if ($recurrenceType === self::TYPE_ONCE) {
            return null;
        }

        $next = Carbon::parse($from);

        do {
            $next = match ($recurrenceType) {
                self::TYPE_DAILY => $next->copy()->addDay(),
                self::TYPE_WEEKLY => $next->copy()->addWeek(),
                self::TYPE_MONTHLY => $next->copy()->addMonth(),
                default => null,
            };

            if ($next === null) {
                return null;
            }
        } while ($next->lte(now()));

        if ($recurrenceEndAt !== null && $next->gt($recurrenceEndAt)) {
            return null;
        }

        return $next;
    }
}
