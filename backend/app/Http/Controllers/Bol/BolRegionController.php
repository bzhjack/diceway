<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolRegion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BolRegionController extends Controller
{
    /**
     * Récupère toutes les régions
     */
    public function getAll()
    {

        $cacheKey = 'bol_regions_all';
        $cacheDuration = 60 * 24; // 60 minutes
        $donnees = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolRegion::with('avantages', 'desavantages', 'noms')->get();
        });
        // Retourner les données en tant que réponse JSON
        return response()->json($donnees);
    }

    public function getOne(Request $request)
    {
        $id = $request->route('id');
        $hero = BolRegion::with('avantages', 'desavantages', 'noms')->where('id', $id)->get()->first();
        if ($hero === null) {
            return response()->json(['error' => 'Country not found'], 404);
        } else {
            return response($hero);
        }
    }
}
