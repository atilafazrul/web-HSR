<?php

namespace App\Http\Controllers\Concerns;

use App\Support\WhatsAppRecipientResolver;
use Illuminate\Http\Request;

trait ResolvesWhatsAppDivisi
{
    protected function whatsAppDivisiFromRequest(Request $request, ?string $fallbackDivisi = null): ?string
    {
        $projekId = $request->filled('projek_kerja_id')
            ? $request->integer('projek_kerja_id')
            : null;

        return app(WhatsAppRecipientResolver::class)->resolveDivisi(
            $projekId,
            $request->user(),
            $fallbackDivisi
        );
    }
}
