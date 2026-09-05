<?php

return [
    'enabled' => env('WHATSAPP_ENABLED', false),

    'provider' => env('WHATSAPP_PROVIDER', 'fonnte'),

    // Meta Cloud API: hanya nomor individu (62...), bukan grup @g.us
    'admin_phone' => env('WHATSAPP_ADMIN_PHONE'),

    // Fallback umum jika target khusus belum diisi.
    'targets' => env('WHATSAPP_TARGETS'),

    // Target khusus per jenis notifikasi (pisahkan koma untuk banyak nomor/grup).
    'biaya_targets' => env('WHATSAPP_BIAYA_TARGETS'),
    'berita_acara_targets' => env('WHATSAPP_BERITA_ACARA_TARGETS'),
    'cuti_targets' => env('WHATSAPP_CUTI_TARGETS'),
    'projek_targets' => env('WHATSAPP_PROJEK_TARGETS'),

    // Kirim WA saat ada biaya baru (notifikasi lonceng di dashboard).
    'notify_biaya' => env('WHATSAPP_NOTIFY_BIAYA', true),

    // Kirim WA untuk pengajuan / hasil approval cuti.
    'notify_cuti' => env('WHATSAPP_NOTIFY_CUTI', true),

    // Kirim WA saat proyek kerja baru dibuat.
    'notify_projek' => env('WHATSAPP_NOTIFY_PROJEK', true),

    // Kirim WA ke pemilik biaya saat Super Admin melunasi pembayaran.
    'notify_lunas' => env('WHATSAPP_NOTIFY_LUNAS', true),

    /*
    | Proyek baru & berita acara: nomor di .env (WHATSAPP_ALWAYS_PHONES + WHATSAPP_LEADERS_*_PHONES).
    | Opsional: WHATSAPP_MATCH_NAMES_FROM_DB=true untuk tambahan lookup users.name di database.
    */
    'route_projek_berita_acara_by_divisi' => env('WHATSAPP_ROUTE_BY_DIVISI', true),

    'match_names_from_db' => env('WHATSAPP_MATCH_NAMES_FROM_DB', false),

    'always_recipient_names' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('WHATSAPP_ALWAYS_NAMES', ''))
    ))),

    'always_recipient_role' => env('WHATSAPP_ALWAYS_ROLE', ''),

    'always_recipient_phones' => env('WHATSAPP_ALWAYS_PHONES', ''),

    'division_leader_names' => [
        'service' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('WHATSAPP_LEADERS_SERVICE', ''))
        ))),
        'it' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('WHATSAPP_LEADERS_IT', ''))
        ))),
        'sales' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('WHATSAPP_LEADERS_SALES', ''))
        ))),
        'kontraktor' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('WHATSAPP_LEADERS_KONTRAKTOR', ''))
        ))),
        'siplah' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('WHATSAPP_LEADERS_SIPLAH', ''))
        ))),
    ],

    'division_leader_phones' => [
        'service' => env('WHATSAPP_LEADERS_SERVICE_PHONES', ''),
        'it' => env('WHATSAPP_LEADERS_IT_PHONES', ''),
        'sales' => env('WHATSAPP_LEADERS_SALES_PHONES', ''),
        'kontraktor' => env('WHATSAPP_LEADERS_KONTRAKTOR_PHONES', ''),
        'siplah' => env('WHATSAPP_LEADERS_SIPLAH_PHONES', ''),
    ],

    'fonnte' => [
        'token' => env('WHATSAPP_FONNTE_TOKEN'),
        'endpoint' => env('WHATSAPP_FONNTE_ENDPOINT', 'https://api.fonnte.com/send'),
    ],

    'meta' => [
        'token' => env('WHATSAPP_META_TOKEN'),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'business_account_id' => env('WHATSAPP_BUSINESS_ACCOUNT_ID'),
        'api_version' => env('WHATSAPP_META_API_VERSION', 'v21.0'),
    ],
];
