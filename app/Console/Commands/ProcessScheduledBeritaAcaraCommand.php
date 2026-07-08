<?php

namespace App\Console\Commands;

use App\Services\ScheduledBeritaAcaraProcessor;
use Illuminate\Console\Command;

class ProcessScheduledBeritaAcaraCommand extends Command
{
    protected $signature = 'berita-acara:process-scheduled';

    protected $description = 'Proses jadwal generate dokumen berita acara (BAST, BAUF, BAM, SPPD) yang sudah jatuh tempo';

    public function handle(ScheduledBeritaAcaraProcessor $processor): int
    {
        $count = $processor->processDue();

        $this->info("Diproses {$count} jadwal berita acara.");

        return self::SUCCESS;
    }
}
