<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolHerosArme;
use Illuminate\Http\Request;
use App\Models\Bol\BolArme;
use Illuminate\Support\Facades\Cache;

class BolArmeController extends Controller
{
    public function getAll()
    {
        // Cache::forget('bol_arme_all'); <= pour invalider le cache
        $cacheKey = 'bol_armes_all';
        $cacheDuration = 60; // 60 minutes
        $donnees = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolArme::all();
        });
        return response()->json($donnees);
    }

    public function create(Request $request, $herosId)
    {
        $newArme = $request->input();
        $arme = BolHerosArme::where('heros_id', $herosId)->where('arme_id', $newArme['arme_id'])->first();
        if ($arme) {
            return response()->json(['message' => 'Arme déjà existante'], 403);
        }
        $heros_armes = [
            'heros_id' => $herosId,
            'arme_id' => $newArme['arme_id']
        ];
        BolHerosArme::create($heros_armes);
        return response()->json(['success' => $newArme]);
    }

    public static function delete($herosId, $id)
    {
        $armure = BolHerosArme::where('heros_id', $herosId)->where('arme_id', $id)->first();
        if (!$armure) {
            return response()->json(['message' => 'Arme non trouvée'], 404);
        }
        $armure->delete();
        return response()->json(['success' => true]);
    }

}
