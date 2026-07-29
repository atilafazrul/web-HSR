<?php

namespace App\Support;

use App\Models\ProjekKerja;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class WhatsAppRecipientResolver
{
    /**
     * @return string[]
     */
    public function phonesForProjekAndBeritaAcara(?string $divisi): array
    {
        $phones = $this->phonesForAlwaysRecipients();

        foreach ($this->phonesForDivisiLeaders($divisi) as $phone) {
            $phones[] = $phone;
        }

        return $this->uniquePhones($phones);
    }

    /**
     * @return string[]
     */
    public function phonesForAlwaysRecipients(): array
    {
        $phones = $this->parsePhoneList(trim((string) config('whatsapp.always_recipient_phones', '')));

        if (! config('whatsapp.match_names_from_db', false)) {
            return $this->uniquePhones($phones);
        }

        $names = config('whatsapp.always_recipient_names', []);
        $role = trim((string) config('whatsapp.always_recipient_role', ''));

        $phones = array_merge($phones, $this->phonesMatchingNames(is_array($names) ? $names : []));

        if ($role !== '') {
            $phones = array_merge($phones, $this->phonesForRole($role, $names));
        }

        return $this->uniquePhones($phones);
    }

    /**
     * @return string[]
     */
    public function phonesForDivisiLeaders(?string $divisi): array
    {
        $key = $this->normalizeDivisiKey($divisi);
        if ($key === '') {
            return [];
        }

        $phoneMap = config('whatsapp.division_leader_phones', []);
        $phones = [];
        if (is_array($phoneMap) && isset($phoneMap[$key]) && is_string($phoneMap[$key])) {
            $phones = $this->parsePhoneList(trim($phoneMap[$key]));
        }

        if (! config('whatsapp.match_names_from_db', false)) {
            if ($phones === []) {
                Log::warning('WhatsApp: nomor pimpinan divisi belum diisi di .env.', [
                    'divisi' => $divisi,
                    'key' => $key,
                    'env' => 'WHATSAPP_LEADERS_'.strtoupper($key).'_PHONES',
                ]);
            }

            return $this->uniquePhones($phones);
        }

        $map = config('whatsapp.division_leader_names', []);
        if (! is_array($map) || ! isset($map[$key])) {
            Log::info('WhatsApp: tidak ada pimpinan divisi dikonfigurasi.', ['divisi' => $divisi, 'key' => $key]);

            return $this->uniquePhones($phones);
        }

        $names = $map[$key];
        if (is_array($names)) {
            $phones = array_merge($phones, $this->phonesMatchingNames($names));
        }

        if ($phones === []) {
            Log::warning('WhatsApp: pimpinan divisi tanpa nomor telepon.', [
                'divisi' => $divisi,
                'key' => $key,
                'names' => $names ?? [],
            ]);
        }

        return $this->uniquePhones($phones);
    }

    public function resolveDivisi(?int $projekKerjaId, ?User $user = null, ?string $fallbackDivisi = null): ?string
    {
        if ($projekKerjaId) {
            $fromProjek = ProjekKerja::query()->find($projekKerjaId)?->divisi;
            if (is_string($fromProjek) && trim($fromProjek) !== '') {
                return trim($fromProjek);
            }
        }

        if ($fallbackDivisi !== null && trim($fallbackDivisi) !== '') {
            return trim($fallbackDivisi);
        }

        $fromUser = trim((string) ($user?->divisi ?? ''));

        return $fromUser !== '' ? $fromUser : null;
    }

    public function normalizeDivisiKey(?string $divisi): string
    {
        $raw = strtolower(trim((string) $divisi));
        if ($raw === '') {
            return '';
        }

        return match ($raw) {
            'it', 'divisi it' => 'it',
            'service', 'divisi service' => 'service',
            'sales', 'divisi sales' => 'sales',
            'kontraktor', 'contractor', 'divisi kontraktor' => 'kontraktor',
            'logistik', 'divisi logistik' => 'logistik',
            'purchasing', 'divisi purchasing' => 'purchasing',
            default => preg_replace('/[^a-z0-9_]/', '', str_replace(' ', '_', $raw)) ?? $raw,
        };
    }

    /**
     * @param  string[]  $nameFragments
     * @return string[]
     */
    private function phonesMatchingNames(array $nameFragments): array
    {
        $fragments = array_values(array_filter(array_map(
            static fn ($n) => strtolower(trim((string) $n)),
            $nameFragments
        )));

        if ($fragments === []) {
            return [];
        }

        $users = User::query()
            ->whereNotNull('no_telepon')
            ->where('no_telepon', '!=', '')
            ->where(function ($q) use ($fragments) {
                foreach ($fragments as $fragment) {
                    $q->orWhereRaw('LOWER(COALESCE(name, \'\')) LIKE ?', ['%'.$fragment.'%']);
                }
            })
            ->get(['id', 'name', 'no_telepon']);

        $phones = [];
        foreach ($users as $user) {
            $phone = trim((string) $user->no_telepon);
            if ($phone !== '') {
                $phones[] = $phone;
            }
        }

        return $phones;
    }

    /**
     * @param  string[]  $excludeNameFragments  already matched by name
     * @return string[]
     */
    private function phonesForRole(string $role, array $excludeNameFragments = []): array
    {
        $normalizedRole = str_replace([' ', '-'], '_', strtolower(trim($role)));

        $query = User::query()
            ->whereNotNull('no_telepon')
            ->where('no_telepon', '!=', '')
            ->whereRaw(
                "REPLACE(REPLACE(LOWER(COALESCE(TRIM(role), '')), ' ', '_'), '-', '_') = ?",
                [$normalizedRole]
            );

        $fragments = array_values(array_filter(array_map(
            static fn ($n) => strtolower(trim((string) $n)),
            $excludeNameFragments
        )));

        if ($fragments !== []) {
            $query->where(function ($q) use ($fragments) {
                foreach ($fragments as $fragment) {
                    $q->orWhereRaw('LOWER(COALESCE(name, \'\')) LIKE ?', ['%'.$fragment.'%']);
                }
            });
        }

        return $query->pluck('no_telepon')->map(fn ($p) => trim((string) $p))->filter()->all();
    }

    /**
     * @return string[]
     */
    private function parsePhoneList(string $value): array
    {
        $parts = preg_split('/[\s,]+/', $value) ?: [];

        return array_values(array_filter(array_map(
            static fn (string $part) => trim($part),
            $parts
        )));
    }

    /**
     * @param  string[]  $phones
     * @return string[]
     */
    private function uniquePhones(array $phones): array
    {
        $seen = [];
        $out = [];

        foreach ($phones as $phone) {
            $digits = preg_replace('/\D+/', '', (string) $phone) ?? '';
            if ($digits === '' || isset($seen[$digits])) {
                continue;
            }
            $seen[$digits] = true;
            $out[] = trim((string) $phone);
        }

        return $out;
    }
}
