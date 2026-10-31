<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolCache;
use App\Models\Bol\BolCombatOption;
use App\Models\Bol\BolDifficulte;
use App\Models\Bol\BolHeroicOption;
use Illuminate\Support\Facades\Cache;

class BolCombatReferenceController extends Controller
{
    public function getCombatOptions()
    {
        $data = Cache::remember('bol_combat_options_all', BolCache::TTL, fn() =>
            BolCombatOption::orderBy('ordre')->get()
        );
        return response()->json($data);
    }

    public function getHeroicOptions()
    {
        $data = Cache::remember('bol_heroic_options_all', BolCache::TTL, fn() =>
            BolHeroicOption::orderBy('ordre')->get()
        );
        return response()->json($data);
    }

    public function getDifficultes()
    {
        $data = Cache::remember('bol_difficultes_all', BolCache::TTL, fn() =>
            BolDifficulte::orderBy('ordre')->get()
        );
        return response()->json($data);
    }
}
