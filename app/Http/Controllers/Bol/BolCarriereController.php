<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolCarriere;
use App\Models\Bol\BolHerosCarriere;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BolCarriereController extends Controller
{
    public function getAll()
    {
        $cacheKey = 'bol_carrieres_all';
        $cacheDuration = 60 * 24; // 60 minutes
        $donnees = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolCarriere::all();
        });
        return response()->json($donnees);
    }

    public static function delete($herosId, $id)
    {
        $carriere = BolHerosCarriere::where('heros_id', $herosId)->where('carriere_id', $id)->first();
        if (!$carriere) {
            return response()->json(['message' => 'Carrière non trouvée'], 404);
        }
        $carriere->delete();
        return response()->json(['success' => true]);
    }

    public static function update($carriereToUpdate, $herosId)
    {
        $carriere = BolHerosCarriere::where('heros_id', $herosId)->where('carriere_id', $carriereToUpdate['carriere_id'])->first();
        if (!$carriere) {
            return response()->json(['message' => 'Carrière non trouvée'], 404);
        }
        BolHerosCarriere::where('id', $carriere['id'])->update($carriereToUpdate);
        return response()->json(['success' => $carriereToUpdate]);
    }

    public function create(Request $request, $herosId)
    {
        $newCarriere = $request->input();
        $carriere = BolHerosCarriere::where('heros_id', $herosId)->where('carriere_id', $newCarriere['carriere_id'])->first();
        if ($carriere) {
            return response()->json(['message' => 'Carrière déjà existante'], 403);
        }
        $heros_carrieres = [
            'heros_id' => $herosId,
            'carriere_id' => $newCarriere['carriere_id'],
            'value' => $newCarriere['value'],
        ];
        BolHerosCarriere::create($heros_carrieres);
        return response()->json(['success' => $newCarriere]);
    }
}
