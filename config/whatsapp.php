<?php

return [
    'enabled' => env('WHATSAPP_ENABLED', false),

    'provider' => env('WHATSAPP_PROVIDER', 'fonnte'),

    // Satu nomor (legacy) atau beberapa nomor/grup, pisahkan dengan koma.
    // Grup WA: gunakan ID grup Fonnte, contoh 120363379743282885@g.us
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

    'fonnte' => [
        'token' => env('WHATSAPP_FONNTE_TOKEN'),
        'endpoint' => env('WHATSAPP_FONNTE_ENDPOINT', 'https://api.fonnte.com/send'),
    ],
];
