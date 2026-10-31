<?php

namespace App\Http\Controllers\Bol\Concerns;

use App\Models\Bol\BolHeros;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

/** Ce qui s'attache à une fiche (carrières, armes, traits…) ne se modifie que par son propriétaire : pour les autres, la fiche n'existe pas. */
trait ProtectsHeros
{
    private function canEditHeros(string $herosId): bool
    {
        $heros = BolHeros::find($herosId);

        return $heros !== null && Gate::allows('update', $heros);
    }

    /**
     * Ne garde d'une liste envoyée par le client que l'équipement de ce compte ou du catalogue :
     * rattacher l'arme privée d'un autre par son id reviendrait à la lire.
     *
     * @param class-string<\App\Models\Bol\BolArme|\App\Models\Bol\BolArmure> $model
     */
    private function keepAccessible(string $model, array $items, callable $idOf): array
    {
        $ids = $model::accessibleTo(Auth::id())->whereIn('id', array_map($idOf, $items))->pluck('id')->all();

        return array_values(array_filter($items, fn ($item) => in_array($idOf($item), $ids)));
    }

    private function herosNotFound(): JsonResponse
    {
        return response()->json(['message' => 'Hero not found'], 404);
    }
}
