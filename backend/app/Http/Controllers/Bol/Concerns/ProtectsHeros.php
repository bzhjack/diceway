<?php

namespace App\Http\Controllers\Bol\Concerns;

use App\Models\Bol\BolHeros;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

/** Ce qui s'attache à une fiche (carrières, armes, traits…) ne se modifie que par son propriétaire : pour les autres, la fiche n'existe pas. */
trait ProtectsHeros
{
    private function canEditHeros(string $herosId): bool
    {
        $heros = BolHeros::find($herosId);

        return $heros !== null && Gate::allows('update', $heros);
    }

    private function herosNotFound(): JsonResponse
    {
        return response()->json(['message' => 'Hero not found'], 404);
    }
}
