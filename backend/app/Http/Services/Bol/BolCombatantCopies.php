<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;

/** Ce qu'une table ou un scénario recopie d'une fiche : ses capacités et ses pouvoirs, tels qu'ils sont au moment de la copie. */
final class BolCombatantCopies
{
    public static function capacites(BolCreature $creature): array
    {
        return collect($creature->capacites ?? [])->map(fn ($c) => [
            'capacite_id' => $c->capacite_id,
            'capacite'    => $c->capacite?->capacite,
            'de_bonus'    => $c->capacite?->de_bonus,
            'de_malus'    => $c->capacite?->de_malus,
            'detail'      => $c->detail,
        ])->values()->toArray();
    }

    /** Les pouvoirs gardent leurs drapeaux de combat : l'écran de combat régénère, prévient ou rappelle d'après eux. */
    public static function pouvoirs(BolDemon $demon): array
    {
        return collect($demon->pouvoirs ?? [])->map(fn ($p) => [
            'pouvoir_id'           => $p->pouvoir_id,
            'pouvoir'              => $p->pouvoir?->pouvoir,
            'detail'               => $p->detail,
            'regeneration'         => (bool) $p->pouvoir?->regeneration,
            'intangible'           => (bool) $p->pouvoir?->intangible,
            'avertissement_combat' => (bool) $p->pouvoir?->avertissement_combat,
        ])->values()->toArray();
    }
}
