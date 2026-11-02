<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolCapacite;
use App\Models\Bol\BolCarriere;
use App\Models\Bol\BolCategorie;
use App\Models\Bol\BolCombatOption;
use App\Models\Bol\BolDesavantage;
use App\Models\Bol\BolLangue;
use App\Models\Bol\BolPouvoir;
use App\Models\Bol\BolRegion;
use App\Models\Bol\BolTaille;
use Illuminate\Support\Facades\Cache;

/** Les listes de référence du jeu : les mêmes pour tous les comptes, gardées en cache. */
class BolReferenceData
{
    private const REGION_RELATIONS = ['avantages', 'desavantages', 'noms', 'langueNative', 'premiereCarriere'];

    public function carrieres()
    {
        return $this->remember('bol_carrieres_all', fn () => BolCarriere::all());
    }

    public function avantages()
    {
        return $this->remember('bol_avantages_all', fn () => BolAvantage::all());
    }

    public function desavantages()
    {
        return $this->remember('bol_desavantages_all', fn () => BolDesavantage::all());
    }

    public function langues()
    {
        return $this->remember('bol_langues_all', fn () => BolLangue::all());
    }

    public function regions()
    {
        return $this->remember('bol_regions_all', fn () => BolRegion::with(self::REGION_RELATIONS)->get());
    }

    public function region(string $id): ?BolRegion
    {
        return BolRegion::with(self::REGION_RELATIONS)->where('id', $id)->first();
    }

    public function tailles()
    {
        return $this->remember('bol_creatures_tailles', fn () => BolTaille::orderBy('id', 'asc')->get());
    }

    public function capacites()
    {
        return $this->remember('bol_creatures_capacites', fn () => BolCapacite::orderBy('id', 'asc')->get());
    }

    public function categories()
    {
        return $this->remember('bol_demons_categories', fn () => BolCategorie::orderBy('id', 'asc')->get());
    }

    public function pouvoirs()
    {
        return $this->remember('bol_demon_pouvoirs', fn () => BolPouvoir::orderBy('id', 'asc')->get());
    }

    public function combatOptions()
    {
        return $this->remember('bol_combat_options_all', fn () => BolCombatOption::orderBy('ordre')->get());
    }

    private function remember(string $key, callable $query)
    {
        return Cache::remember($key, BolCache::TTL, $query);
    }
}
