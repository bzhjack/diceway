<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolDesavantage;
use App\Models\Bol\BolHerosCarriere;
use App\Models\Bol\BolHerosLangue;
use App\Models\Bol\BolHerosTrait;
use Illuminate\Database\Eloquent\Model;

/** Ce qui s'attache à une fiche, une ligne à la fois : ses carrières, ses langues, ses traits. */
class BolHeroDetailsService
{
    public function carriere(string $herosId, mixed $carriereId): ?BolHerosCarriere
    {
        return BolHerosCarriere::where('heros_id', $herosId)->where('carriere_id', $carriereId)->first();
    }

    public function addCarriere(string $herosId, array $carriere): void
    {
        BolHerosCarriere::create([
            'heros_id' => $herosId,
            'carriere_id' => $carriere['carriere_id'],
            'value' => $carriere['value'],
        ]);
    }

    public function langue(string $herosId, mixed $langueId): ?BolHerosLangue
    {
        return BolHerosLangue::where('heros_id', $herosId)->where('langue_id', $langueId)->first();
    }

    public function addLangue(string $herosId, array $langue): void
    {
        BolHerosLangue::create(['heros_id' => $herosId, 'langue_id' => $langue['langue_id']]);
    }

    public function trait(string $herosId, mixed $id): ?BolHerosTrait
    {
        return BolHerosTrait::where('heros_id', $herosId)->where('id', $id)->first();
    }

    public function hasTrait(string $herosId, mixed $traitableId, mixed $type): bool
    {
        return BolHerosTrait::where('heros_id', $herosId)->where('traitable_id', $traitableId)->where('type', $type)->exists();
    }

    public function addTrait(string $herosId, array $trait): BolHerosTrait
    {
        return BolHerosTrait::create([
            'heros_id' => $herosId,
            'traitable_id' => $trait['traitable_id'],
            'type' => $trait['type'],
            'detail' => $trait['detail'],
            'region_id' => $trait['region_id'],
            'traitable_type' => $trait['type'] == 'A' ? BolAvantage::class : BolDesavantage::class,
            'carriere' => $trait['carriere'],
        ]);
    }

    public function remove(Model $line): void
    {
        $line->delete();
    }
}
