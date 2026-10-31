<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Bol\Concerns\ProtectsHeros;
use App\Http\Services\Bol\BolCache;
use App\Models\Bol\BolCarriere;
use App\Models\Bol\BolHerosCarriere;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class BolCarriereController extends Controller
{
    use ProtectsHeros;

    public function getAll()
    {
        $cacheKey = 'bol_carrieres_all';
        $cacheDuration = BolCache::TTL;
        $donnees = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolCarriere::all();
        });
        return response()->json($donnees);
    }

    public function delete($herosId, $id)
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
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
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
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
