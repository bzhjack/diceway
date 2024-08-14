<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolHerosLangue;
use App\Models\Bol\BolLangue;
use Illuminate\Support\Facades\Cache;

class BolLangueController extends Controller
{
    /**
     * Récupère toutes les régions
     */
    public function getAll()
    {
        $cacheKey = 'bol_langues_all';
        $cacheDuration = 60; // 60 minutes
        $donnees = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolLangue::all();
        });
        return response()->json($donnees);
    }

    public static function delete($herosId, $id)
    {
        $langue = BolHerosLangue::where('heros_id', $herosId)->where('langue_id', $id)->first();
        if (!$langue) {
            return response()->json(['message' => 'Langue non trouvée'], 404);
        }
        $langue->delete();
        return response()->json(['success' => true]);
    }

    public function create(Request $request, $herosId)
    {
        $newLangue = $request->input();
        $langue = BolHerosLangue::where('heros_id', $herosId)->where('langue_id', $newLangue['langue_id'])->first();
        if ($langue) {
            return response()->json(['message' => 'Langue déjà existante'], 403);
        }
        $heros_langues = [
            'heros_id' => $herosId,
            'langue_id' => $newLangue['langue_id']
        ];
        BolHerosLangue::create($heros_langues);
        return response()->json(['success' => $newLangue]);
    }
}
