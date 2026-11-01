<?php

namespace App\Http\Services\Bol;

use Illuminate\Support\Facades\Auth;

final class BolAccessibleEquipment
{
    /**
     * Ne garde d'une liste envoyée par le client que l'équipement de ce compte ou du catalogue :
     * rattacher l'arme privée d'un autre par son id reviendrait à la lire.
     *
     * @param class-string<\App\Models\Bol\BolArme|\App\Models\Bol\BolArmure> $model
     */
    public static function keep(string $model, array $items, callable $idOf): array
    {
        $ids = $model::accessibleTo(Auth::id())->whereIn('id', array_map($idOf, $items))->pluck('id')->all();

        return array_values(array_filter($items, fn ($item) => in_array($idOf($item), $ids)));
    }
}
