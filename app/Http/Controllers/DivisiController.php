<?php

namespace App\Http\Controllers;

use App\Models\Divisi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DivisiController extends Controller
{
    public const AVAILABLE_MODULES = [
        'inventory',
        'progres_pekerjaan',
        'archive_pekerjaan',
        'berita_acara',
        'target',
        'pembelian',
        'inventory_logistik',
        'rfi',
        'work_checklist_planning',
        'work_checklist_realisasi',
        'daily_report',
    ];

    public const DEFAULT_SLUGS = [
        'it',
        'service',
        'kontraktor',
        'sales',
        'logistik',
        'purchasing',
        'siplah',
    ];

    private function isSuperAdmin(Request $request): bool
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }
        $role = strtolower(str_replace([' ', '-'], '_', trim((string) ($user->role ?? ''))));
        return $role === 'super_admin';
    }

    private static function defaultCardImageForSlug(string $slug): string
    {
        $map = [
            'it' => '/images/IT Card.png',
            'service' => '/images/Card Service.png',
            'kontraktor' => '/images/Kontraktor Card.png',
            'sales' => '/images/Card Sales.png',
            'logistik' => '/images/logistik card.png',
            'purchasing' => '/images/Purchasing Card.png',
            'siplah' => '/images/Purchasing Card.png',
        ];
        return $map[strtolower($slug)] ?? '/images/IT Card.png';
    }

    private static function normalizeIconKey(?string $icon, string $slug = ''): string
    {
        $raw = strtolower(trim((string) $icon));
        $map = [
            'monitor' => 'monitor',
            'wrench' => 'wrench',
            'hammer' => 'hammer',
            'hardhat' => 'hammer',
            'barchart3' => 'bar_chart',
            'bar_chart' => 'bar_chart',
            'truck' => 'truck',
            'shoppingcart' => 'shopping_cart',
            'shopping_cart' => 'shopping_cart',
            'graduationcap' => 'graduation_cap',
            'graduation_cap' => 'graduation_cap',
            'building' => 'building',
            'building2' => 'building',
            'briefcase' => 'briefcase',
            'users' => 'users',
            'wallet' => 'wallet',
            'receipt' => 'wallet',
            'layers' => 'layers',
            'globe' => 'globe',
            'shield' => 'shield',
        ];
        if (isset($map[$raw])) {
            return $map[$raw];
        }
        $slugMap = [
            'it' => 'monitor',
            'service' => 'wrench',
            'kontraktor' => 'hammer',
            'sales' => 'bar_chart',
            'logistik' => 'truck',
            'purchasing' => 'shopping_cart',
            'siplah' => 'graduation_cap',
        ];
        return $slugMap[strtolower($slug)] ?? 'building';
    }

    private function normalizeStoredModules($rawModules): array
    {
        if (is_string($rawModules)) {
            $decoded = json_decode($rawModules, true);
            $rawModules = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($rawModules)) {
            return ['inventory', 'progres_pekerjaan', 'archive_pekerjaan'];
        }

        $result = [];
        foreach ($rawModules as $m) {
            if (!is_string($m)) {
                continue;
            }
            $key = strtolower(trim($m));
            if ($key === 'projek') {
                $result[] = 'progres_pekerjaan';
                $result[] = 'archive_pekerjaan';
            } elseif ($key === 'logistik_inventory') {
                $result[] = 'inventory_logistik';
            } elseif ($key === 'kontraktor_form') {
                $result[] = 'rfi';
                $result[] = 'work_checklist_planning';
                $result[] = 'work_checklist_realisasi';
                $result[] = 'daily_report';
            } elseif (in_array($key, self::AVAILABLE_MODULES, true)) {
                $result[] = $key;
            }
        }

        return array_values(array_unique($result));
    }

    private function sanitizeIncomingModules($modules): array
    {
        if (is_string($modules)) {
            $decoded = json_decode($modules, true);
            $modules = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($modules)) {
            return ['progres_pekerjaan'];
        }
        return array_values(array_unique(array_filter(
            $modules,
            fn ($m) => is_string($m) && in_array($m, self::AVAILABLE_MODULES, true)
        )));
    }

    private function resolveCardImage(?string $image, string $slug): string
    {
        if ($image && trim($image) !== '') {
            if (str_starts_with($image, '/storage/')) {
                $relPath = ltrim(substr($image, strlen('/storage/')), '/');
                if (Storage::disk('public')->exists($relPath)) {
                    return $image;
                }
                return self::defaultCardImageForSlug($slug);
            }
            return $image;
        }
        return self::defaultCardImageForSlug($slug);
    }

    private function formatDivisi(Divisi $div): array
    {
        $slug = strtolower((string) $div->slug);
        $isDefault = in_array($slug, self::DEFAULT_SLUGS, true);
        $cardImage = $this->resolveCardImage($div->image, $slug);
        $iconKey = self::normalizeIconKey($div->icon, $slug);
        $modules = $this->normalizeStoredModules($div->modules);

        return [
            'id' => $div->id,
            'name' => $div->name,
            'slug' => $slug,
            'subtitle_id' => $div->description ?: ('Kelola aset dan progres pekerjaan Divisi ' . $div->name),
            'subtitle_en' => $div->description ?: ('Manage assets and work progress for ' . $div->name . ' Division'),
            'description' => $div->description,
            'icon' => $div->icon,
            'icon_key' => $iconKey,
            'image' => $cardImage,
            'card_image' => $cardImage,
            'modules' => $modules,
            'is_default' => $isDefault,
            'is_active' => (bool) ($div->is_active ?? true),
            'sort_order' => (int) ($div->order ?? $div->id),
            'order' => (int) ($div->order ?? $div->id),
        ];
    }

    public function index()
    {
        $orderCol = Schema::hasColumn('divisis', 'order')
            ? 'order'
            : (Schema::hasColumn('divisis', 'sort_order') ? 'sort_order' : 'id');

        $divisis = Divisi::orderBy($orderCol, 'asc')->orderBy('id', 'asc')->get();

        $formatted = $divisis->map(fn (Divisi $d) => $this->formatDivisi($d))->values();

        return response()->json([
            'success' => true,
            'data' => $formatted,
        ]);
    }

    public function store(Request $request)
    {
        if (!$this->isSuperAdmin($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Super Admin yang dapat menambah divisi baru',
            ], 403);
        }

        $name = trim((string) $request->input('name', ''));
        $rawSlug = trim((string) ($request->input('slug') ?: $name));
        $slug = Str::slug($rawSlug, '-');

        $reservedSlugs = [
            'dashboard', 'karyawan', 'rekap-akun', 'cuti-approval', 'cuti',
            'activity-log', 'berita-acara', 'projek-kerja', 'profile', 'settings',
        ];

        if ($slug === '' || in_array($slug, $reservedSlugs, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Nama atau kode URL divisi tidak valid atau bentrok dengan menu sistem.',
            ], 422);
        }

        $request->merge([
            'name' => $name,
            'slug' => $slug,
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:divisis,name'],
            'slug' => ['required', 'string', 'max:100', 'unique:divisis,slug'],
            'subtitle_id' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'icon_key' => ['nullable', 'string', 'max:50'],
            'card_image' => ['nullable', 'string', 'max:255'],
            'image_file' => ['nullable', 'image', 'max:4096'],
            'modules' => ['nullable'],
        ], [
            'name.required' => 'Nama divisi wajib diisi.',
            'name.unique' => 'Nama divisi tersebut sudah terdaftar.',
            'slug.unique' => 'Slug / URL divisi tersebut sudah terdaftar.',
        ]);

        $cardImage = $validated['card_image'] ?? '/images/IT Card.png';
        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('divisi-cards', 'public');
            $cardImage = '/storage/' . $path;
        }

        $modules = $this->sanitizeIncomingModules(
            $request->input('modules', ['inventory', 'progres_pekerjaan', 'archive_pekerjaan'])
        );

        $orderCol = Schema::hasColumn('divisis', 'order') ? 'order' : 'id';
        $maxOrder = (int) Divisi::max($orderCol);

        $description = $validated['subtitle_id']
            ?? $validated['description']
            ?? ('Kelola operasional dan progres pekerjaan Divisi ' . $validated['name']);

        $divisi = Divisi::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'description' => $description,
            'icon' => $validated['icon_key'] ?: 'building',
            'image' => $cardImage,
            'is_active' => true,
            'modules' => $modules,
            'order' => $maxOrder + 1,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Divisi baru berhasil ditambahkan',
            'data' => $this->formatDivisi($divisi),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        if (!$this->isSuperAdmin($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Super Admin yang dapat mengubah divisi & modul',
            ], 403);
        }

        $divisi = is_numeric($id)
            ? Divisi::find($id)
            : Divisi::where('slug', strtolower((string) $id))->first();

        if (!$divisi) {
            return response()->json([
                'success' => false,
                'message' => 'Divisi tidak ditemukan',
            ], 404);
        }

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('divisis', 'name')->ignore($divisi->id),
            ],
            'subtitle_id' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'icon_key' => ['nullable', 'string', 'max:50'],
            'card_image' => ['nullable', 'string', 'max:255'],
            'image_file' => ['nullable', 'image', 'max:4096'],
            'modules' => ['nullable'],
        ]);

        $isDefault = in_array(strtolower((string) $divisi->slug), self::DEFAULT_SLUGS, true);

        if (isset($validated['name']) && !$isDefault) {
            $divisi->name = trim($validated['name']);
        }
        if (array_key_exists('subtitle_id', $validated) || array_key_exists('description', $validated)) {
            $divisi->description = $validated['subtitle_id'] ?? $validated['description'] ?? $divisi->description;
        }
        if (!empty($validated['icon_key'])) {
            $divisi->icon = $validated['icon_key'];
        }
        if (!empty($validated['card_image'])) {
            $divisi->image = $validated['card_image'];
        }
        if ($request->hasFile('image_file')) {
            if ($divisi->image && str_starts_with($divisi->image, '/storage/divisi-')) {
                $oldRel = ltrim(str_replace('/storage/', '', $divisi->image), '/');
                if (Storage::disk('public')->exists($oldRel)) {
                    Storage::disk('public')->delete($oldRel);
                }
            }
            $path = $request->file('image_file')->store('divisi-cards', 'public');
            $divisi->image = '/storage/' . $path;
        }
        if ($request->has('modules')) {
            $divisi->modules = $this->sanitizeIncomingModules($request->input('modules'));
        }

        $divisi->save();

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi divisi & modul berhasil diperbarui',
            'data' => $this->formatDivisi($divisi),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->isSuperAdmin($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya Super Admin yang dapat menghapus divisi',
            ], 403);
        }

        $divisi = is_numeric($id)
            ? Divisi::find($id)
            : Divisi::where('slug', strtolower((string) $id))->first();

        if (!$divisi) {
            return response()->json([
                'success' => false,
                'message' => 'Divisi tidak ditemukan',
            ], 404);
        }

        $isDefault = in_array(strtolower((string) $divisi->slug), self::DEFAULT_SLUGS, true);
        if ($isDefault) {
            return response()->json([
                'success' => false,
                'message' => 'Divisi bawaan sistem tidak dapat dihapus, namun modulnya tetap dapat diubah.',
            ], 422);
        }

        if ($divisi->image && str_starts_with($divisi->image, '/storage/divisi-')) {
            $oldRel = ltrim(str_replace('/storage/', '', $divisi->image), '/');
            if (Storage::disk('public')->exists($oldRel)) {
                Storage::disk('public')->delete($oldRel);
            }
        }

        $divisi->delete();

        return response()->json([
            'success' => true,
            'message' => 'Divisi berhasil dihapus',
        ]);
    }
}
