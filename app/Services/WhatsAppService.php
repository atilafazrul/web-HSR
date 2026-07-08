<?php

namespace App\Services;

use App\Models\ScheduledBeritaAcaraDocument;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class WhatsAppService
{
    public function sendToAdmin(string $message): bool
    {
        if (!config('whatsapp.enabled')) {
            Log::info('WhatsApp disabled — pesan tidak dikirim.', ['message' => $message]);

            return false;
        }

        $phone = $this->resolveAdminPhone();
        if ($phone === null) {
            Log::warning('WhatsApp admin phone tidak dikonfigurasi.', ['message' => $message]);

            return false;
        }

        return $this->send($phone, $message);
    }

    public function notifyScheduledDocumentCreated(ScheduledBeritaAcaraDocument $schedule): bool
    {
        $schedule->loadMissing('projekKerja');

        $typeLabel = strtoupper($schedule->document_type);
        $projectName = $schedule->projekKerja?->jenis_pekerjaan ?? 'projek';
        $nomor = $schedule->nomor_surat ? " (*{$schedule->nomor_surat}*)" : '';

        $message = "{$typeLabel} untuk projek *{$projectName}* sudah dibuat{$nomor}. Segera kirimkan ke client.";

        return $this->sendToAdmin($message);
    }

    public function send(string $phone, string $message): bool
    {
        $provider = config('whatsapp.provider', 'fonnte');

        if ($provider === 'fonnte') {
            return $this->sendViaFonnte($phone, $message);
        }

        Log::warning('WhatsApp provider tidak dikenal.', ['provider' => $provider]);

        return false;
    }

    private function sendViaFonnte(string $phone, string $message): bool
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
                'target' => $this->normalizePhone($phone),
                'message' => $message,
            ]);

            if (!$response->successful()) {
                Log::error('Gagal kirim WhatsApp Fonnte.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::error('Error kirim WhatsApp Fonnte.', ['error' => $e->getMessage()]);

            return false;
        }
    }

    private function resolveAdminPhone(): ?string
    {
        $configured = trim((string) config('whatsapp.admin_phone'));
        if ($configured !== '') {
            return $configured;
        }

        $admin = User::query()
            ->whereIn('role', ['super_admin', 'admin'])
            ->whereNotNull('no_telepon')
            ->where('no_telepon', '!=', '')
            ->orderByRaw("CASE WHEN role = 'super_admin' THEN 0 ELSE 1 END")
            ->first();

        return $admin?->no_telepon;
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
