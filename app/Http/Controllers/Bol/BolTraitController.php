<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolDesavantage;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BolTraitController extends Controller
{
    public function getAllAvantages()
    {
        // Récupérer toutes les lignes de votre modèle
        $donnees = BolAvantage::all();

        // Retourner les données en tant que réponse JSON
        return response()->json($donnees);
    }

    public function getAllDesavantages()
    {
        // Récupérer toutes les lignes de votre modèle
        $donnees = BolDesavantage::all();

        // Retourner les données en tant que réponse JSON
        return response()->json($donnees);
    }

    public static function update(Request $request)
    {
        $heros = $request->except('traits');
        // Maj du cout en heroisme
        BolHeros::where('id', $heros['id'])->update($heros);
        $traits = $request->input('traits');
        $id = $heros["id"];
        // Supprimez les traits existants pour le héros donné
        BolHerosTrait::where('heros_id', $id)->delete();
        // Insérez les nouveaux traits
        foreach ($traits as $trait) {
            $traitable_type = $trait['type'] == 'A' ? BolAvantage::class : BolDesavantage::class;
            $heros_traits = [
                'heros_id' => $id,
                'traitable_id' => $trait['traitable_id'],
                'type' => $trait['type'],
                'detail' => $trait['detail'],
                'traitable_type' => $traitable_type,
            ];
            BolHerosTrait::create($heros_traits);
        }
        return response()->json($heros);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function delete(Request $request): \Illuminate\Http\JsonResponse
    {
        $heros = $request->except('traits');
        $id = $heros["id"];
        BolHerosTrait::where('heros_id', $id)->delete();
        // Return a successful response
        return response()->json(['message' => 'Traits deleted successfully'], Response::HTTP_OK);
    }
public function create(Request $request, $herosId)
    {
        $newTrait = $request->input();
        $trait = BolHerosTrait::where('heros_id', $herosId)->where('traitable_id', $newTrait['traitable_id'])->first();
        if ($trait) {
            return response()->json(['message' => 'Traits déjà existant'], 403);
        }
           $traitable_type = $newTrait['type'] == 'A' ? BolAvantage::class : BolDesavantage::class;
                    $heros_trait = [
                        'heros_id' => $herosId,
                        'traitable_id' => $newTrait['traitable_id'],
                        'type' => $newTrait['type'],
                        'detail' => $newTrait['detail'],
                        'traitable_type' => $traitable_type,
                    ];
                    BolHerosTrait::create($heros_trait);
        return response()->json(['success' => $newTrait]);
    }
}
