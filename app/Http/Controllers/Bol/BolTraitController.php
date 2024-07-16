<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolDesavantage;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class BolTraitController extends Controller
{
    public function getAllAvantages()
    {
        $cacheKey = 'bol_avantages_all';
        $cacheDuration = 60; // 60 minutes
        $donnees = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolAvantage::all();
        });
        // Retourner les données en tant que réponse JSON
        return response()->json($donnees);
    }

    public function getAllDesavantages()
    {

        $cacheKey = 'bol_desavantages_all';
        $cacheDuration = 60; // 60 minutes
        $donnees = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolDesavantage::all();
        });
        // Retourner les données en tant que réponse JSON
        return response()->json($donnees);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function delete($herosId, $id): \Illuminate\Http\JsonResponse
    {
        $trait = BolHerosTrait::where('heros_id', $herosId)->where('id', $id)->first();
        if (!$trait) {
            return response()->json(['message' => 'Trait non trouvé'], 404);
        }
        $trait->delete();
        return response()->json(['success' => true]);
    }

    public function create(Request $request, $herosId)
    {
        $newTrait = $request->input();
        $trait = BolHerosTrait::where('heros_id', $herosId)->where('traitable_id', $newTrait['traitable_id'])->where('type', $newTrait['type'])->first();
        if ($trait) {
            return response()->json(['message' => 'Traits déjà existant'], 403);
        }
        $traitable_type = $newTrait['type'] == 'A' ? BolAvantage::class : BolDesavantage::class;
        $heros_trait = [
            'heros_id' => $herosId,
            'traitable_id' => $newTrait['traitable_id'],
            'type' => $newTrait['type'],
            'detail' => $newTrait['detail'],
            'region_id' => $newTrait['region_id'],
            'traitable_type' => $traitable_type,
        ];
        $created = BolHerosTrait::create($heros_trait);
        return response()->json($created);
    }
}
