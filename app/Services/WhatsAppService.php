<?php

namespace App\Services;

use App\Models\ScheduledBeritaAcaraDocument;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class WhatsAppService
{
    public function sendToAdmin(string $message, ?string $purpose = null): bool
    {
        if (!config('whatsapp.enabled')) {
            Log::info('WhatsApp disabled — pesan tidak dikirim.', ['message' => $message]);

            return false;
        }

        $targets = $this->resolveTargets($purpose);
        if ($targets === []) {
            Log::warning('WhatsApp target tidak dikonfigurasi.', [
                'purpose' => $purpose,
                'message' => $message,
            ]);

            return false;
        }

        return $this->send($this->formatTargetsForProvider($targets), $message);
    }

    public function notifyDocumentCreated(string $typeLabel, ?string $contextName = null, ?string $nomor = null): bool
    {
        $context = trim((string) $contextName);
        if ($context === '') {
            $context = 'dokumen';
        }

        $nomorPart = $nomor ? " (*{$nomor}*)" : '';
        $message = "{$typeLabel} untuk *{$context}* sudah dibuat{$nomorPart}. Segera kirimkan ke client.";

        return $this->sendToAdmin($message, 'berita_acara');
    }

    public function notifyScheduledDocumentCreated(ScheduledBeritaAcaraDocument $schedule): bool
    {
        $schedule->loadMissing('projekKerja');

        $typeLabel = strtoupper(str_replace('_', ' ', $schedule->document_type));
        $projectName = $schedule->projekKerja?->jenis_pekerjaan ?? 'projek';

        return $this->notifyDocumentCreated($typeLabel, $projectName, $schedule->nomor_surat);
    }

    public function notifyCuti(string $title, string $message): bool
    {
        if (!config('whatsapp.enabled') || !config('whatsapp.notify_cuti', true)) {
            return false;
        }

        return $this->sendToAdmin("*{$title}*\n{$message}", 'cuti');
    }

    public function notifyProjek(string $title, string $message): bool
    {
        if (!config('whatsapp.enabled') || !config('whatsapp.notify_projek', true)) {
            return false;
        }

        return $this->sendToAdmin("*{$title}*\n{$message}", 'projek');
    }

    public function notifyCutiToUser(?User $user, string $message): bool
    {
        if (!config('whatsapp.enabled') || !config('whatsapp.notify_cuti', true)) {
            return false;
        }

        return $this->notifyToUser($user, $message);
    }

    public function notifyLunasToUser(?User $user, string $message): bool
    {
        if (!config('whatsapp.enabled') || !config('whatsapp.notify_lunas', true)) {
            return false;
        }

        return $this->notifyToUser($user, $message);
    }

    public function notifyToUser(?User $user, string $message): bool
    {
        $phone = trim((string) ($user?->no_telepon ?? ''));
        if ($phone === '') {
            Log::info('WhatsApp user phone kosong — pesan tidak dikirim.', [
                'user_id' => $user?->id,
                'message' => $message,
            ]);

            return false;
        }

        return $this->send($this->normalizeTarget($phone), $message);
    }

    public function send(string $target, string $message): bool
    {
        $provider = config('whatsapp.provider', 'fonnte');

        if ($provider === 'fonnte') {
            return $this->sendViaFonnte($target, $message);
        }

        Log::warning('WhatsApp provider tidak dikenal.', ['provider' => $provider]);

        return false;
    }

    private function sendViaFonnte(string $target, string $message): bool
    {
        $token = config('whatsapp.fonnte.token');
        if (empty($token)) {
            Log::warning('WHATSAPP_FONNTE_TOKEN belum diisi.');

            return false;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => $token,
            ])->asForm()->post(config('whatsapp.fonnte.endpoint'), [
                'target' => $target,
                'message' => $message,
            ]);

            if (!$response->successful()) {
                Log::error('Gagal kirim WhatsApp Fonnte.', [
                    'target' => $target,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::error('Error kirim WhatsApp Fonnte.', [
                'target' => $target,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * @return string[]
     */
    private function resolveTargets(?string $purpose = null): array
    {
        $purposeConfig = match ($purpose) {
            'biaya' => 'whatsapp.biaya_targets',
            'berita_acara' => 'whatsapp.berita_acara_targets',
            'cuti' => 'whatsapp.cuti_targets',
            'projek' => 'whatsapp.projek_targets',
            default => null,
        };

        if ($purposeConfig !== null) {
            $configured = trim((string) config($purposeConfig));
            if ($configured !== '') {
                return $this->parseTargets($configured);
            }

            if (in_array($purpose, ['cuti', 'projek'], true)) {
                $biayaTargets = trim((string) config('whatsapp.biaya_targets'));
                if ($biayaTargets !== '') {
                    return $this->parseTargets($biayaTargets);
                }
            }
        }

        $configured = trim((string) config('whatsapp.targets'));
        if ($configured === '') {
            $configured = trim((string) config('whatsapp.admin_phone'));
        }

        if ($configured !== '') {
            return $this->parseTargets($configured);
        }

        $admin = User::query()
            ->whereIn('role', ['super_admin', 'admin'])
            ->whereNotNull('no_telepon')
            ->where('no_telepon', '!=', '')
            ->orderByRaw("CASE WHEN role = 'super_admin' THEN 0 ELSE 1 END")
            ->first();

        return $admin?->no_telepon ? [$admin->no_telepon] : [];
    }

    /**
     * @return string[]
     */
    private function parseTargets(string $value): array
    {
        $parts = preg_split('/[\s,]+/', $value) ?: [];

        return array_values(array_filter(array_map(
            static fn (string $part) => trim($part),
            $parts
        )));
    }

    /**
     * @param  string[]  $targets
     */
    private function formatTargetsForProvider(array $targets): string
    {
        return implode(',', array_map(fn (string $target) => $this->normalizeTarget($target), $targets));
    }

    private function normalizeTarget(string $target): string
    {
        if (str_contains($target, '@g.us')) {
            return trim($target);
        }

        return $this->normalizePhone($target);
    }

    private function normalizePhone(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (str_starts_with($digits, '0')) {
            return '62' . substr($digits, 1);
        }

        if (!str_starts_with($digits, '62')) {
            return '62' . $digits;
        }

        return $digits;
    }
}
