<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\ProjekKerja;
use App\Models\User;
use Illuminate\Support\Str;

class ProjekKerjaNotificationService
{
    /**
     * @return array<int, int> User IDs yang menerima notifikasi divisi baru
     */
    public function notifyAdminsNewProjek(ProjekKerja $projek, ?User $creator = null): array
    {
        $targetDivisi = strtolower(trim((string) $projek->divisi));
        if ($targetDivisi === '') {
            return [];
        }

        $creator = $creator ?? auth()->user();
        $creatorId = $creator?->id;

        $admins = User::query()
            ->whereRaw('LOWER(TRIM(COALESCE(divisi, ""))) = ?', [$targetDivisi])
            ->whereRaw(
                "REPLACE(REPLACE(LOWER(COALESCE(TRIM(role), '')), ' ', '_'), '-', '_') = ?",
                ['admin']
            )
            ->when($creatorId, fn ($q) => $q->where('id', '!=', $creatorId))
            ->get(['id']);

        if ($admins->isEmpty()) {
            return [];
        }

        $fromDivisi = trim((string) ($projek->created_by_divisi ?? ''));
        $fromLabel = $fromDivisi !== '' ? $fromDivisi : 'lain';

        $notifiedIds = [];
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'projek_kerja_baru',
                'title' => 'Proyek kerja baru',
                'message' => sprintf(
                    '%s — %s (dari divisi %s)',
                    $projek->report_no,
                    $projek->jenis_pekerjaan,
                    $fromLabel
                ),
                'data' => [
                    'projek_kerja_id' => $projek->id,
                    'report_no' => $projek->report_no,
                    'divisi' => $projek->divisi,
                    'created_by_divisi' => $projek->created_by_divisi,
                ],
            ]);
            $notifiedIds[] = $admin->id;
        }

        return $notifiedIds;
    }

    /**
     * @param  array<int, mixed>  $karyawanTerlibat
     * @param  array<int, mixed>  $invitedUserIds
     * @return array<int, int>
     */
    public function resolveInvitedUserIds(array $karyawanTerlibat, array $invitedUserIds): array
    {
        $ids = [];

        foreach (array_merge($karyawanTerlibat, $invitedUserIds) as $token) {
            $user = $this->resolveUserFromToken((string) $token);
            if ($user) {
                $ids[$user->id] = $user->id;
            }
        }

        return array_values($ids);
    }

    /**
     * @param  array<int, int>  $userIds
     * @param  array<int, int>  $excludeUserIds
     */
    public function notifyKaryawanInvited(
        ProjekKerja $projek,
        array $userIds,
        ?User $creator = null,
        array $excludeUserIds = []
    ): void {
        $creatorId = $creator?->id ?? auth()->id();
        $exclude = array_flip(array_filter(array_merge(
            $excludeUserIds,
            $creatorId ? [$creatorId] : []
        )));

        $inviterName = trim((string) (($creator ?? auth()->user())?->name ?? 'Sistem'));
        if ($inviterName === '') {
            $inviterName = 'Sistem';
        }

        foreach ($userIds as $userId) {
            if (isset($exclude[$userId])) {
                continue;
            }

            Notification::create([
                'user_id' => $userId,
                'type' => 'projek_kerja_invite',
                'title' => 'Undangan proyek kerja',
                'message' => sprintf(
                    '%s — %s (diundang oleh %s)',
                    $projek->report_no,
                    $projek->jenis_pekerjaan,
                    $inviterName
                ),
                'data' => [
                    'projek_kerja_id' => $projek->id,
                    'report_no' => $projek->report_no,
                    'divisi' => $projek->divisi,
                    'created_by_divisi' => $projek->created_by_divisi,
                ],
            ]);
        }
    }

    /**
     * @param  array<int, mixed>|null  $previousKaryawanTerlibat
     * @param  array<int, mixed>|null  $previousInvitedUserIds
     */
    public function notifyNewInvitesAfterUpdate(
        ProjekKerja $projek,
        ?array $previousKaryawanTerlibat,
        ?array $previousInvitedUserIds,
        ?User $creator = null
    ): void {
        $previousIds = $this->resolveInvitedUserIds(
            is_array($previousKaryawanTerlibat) ? $previousKaryawanTerlibat : [],
            is_array($previousInvitedUserIds) ? $previousInvitedUserIds : []
        );

        $currentIds = $this->resolveInvitedUserIds(
            is_array($projek->karyawan_terlibat) ? $projek->karyawan_terlibat : [],
            is_array($projek->invited_user_ids) ? $projek->invited_user_ids : []
        );

        $newIds = array_values(array_diff($currentIds, $previousIds));

        if (empty($newIds)) {
            return;
        }

        $this->notifyKaryawanInvited($projek, $newIds, $creator);
    }

    protected function resolveUserFromToken(string $token): ?User
    {
        $t = trim($token);
        if ($t === '') {
            return null;
        }

        if (ctype_digit($t)) {
            return User::query()->find((int) $t);
        }

        $lower = Str::lower($t);

        return User::query()
            ->where(function ($q) use ($lower) {
                $q->whereRaw('LOWER(TRIM(COALESCE(name, \'\'))) = ?', [$lower])
                    ->orWhereRaw('LOWER(TRIM(COALESCE(email, \'\'))) = ?', [$lower]);
            })
            ->orderByDesc('id')
            ->first();
    }
}
