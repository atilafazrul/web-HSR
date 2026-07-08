<?php

namespace App\Services;

use App\Models\ScheduledBeritaAcaraDocument;
use App\Services\BeritaAcara\ScheduledBeritaAcaraGenerator;
use Illuminate\Support\Facades\Log;
use Throwable;

class ScheduledBeritaAcaraProcessor
{
    public function __construct(
        private readonly ScheduledBeritaAcaraGenerator $generator,
        private readonly WhatsAppService $whatsAppService,
    ) {
    }

    public function processDue(): int
    {
        $processed = 0;

        ScheduledBeritaAcaraDocument::due()
            ->with('projekKerja')
            ->orderBy('scheduled_at')
            ->get()
            ->each(function (ScheduledBeritaAcaraDocument $schedule) use (&$processed) {
                $this->processOne($schedule);
                $processed++;
            });

        return $processed;
    }

    public function processOne(ScheduledBeritaAcaraDocument $schedule): void
    {
        try {
            $result = $this->generator->generate($schedule);

            $schedule->update([
                'status' => ScheduledBeritaAcaraDocument::STATUS_COMPLETED,
                'nomor_surat' => $result['nomor_surat'],
                'generated_document_id' => $result['document_id'],
                'processed_at' => now(),
                'error_message' => null,
            ]);

            $this->whatsAppService->notifyScheduledDocumentCreated($schedule->fresh(['projekKerja']));
        } catch (Throwable $e) {
            Log::error('Gagal memproses jadwal berita acara.', [
                'schedule_id' => $schedule->id,
                'error' => $e->getMessage(),
            ]);

            $schedule->update([
                'status' => ScheduledBeritaAcaraDocument::STATUS_FAILED,
                'processed_at' => now(),
                'error_message' => $e->getMessage(),
            ]);
        }
    }
}
