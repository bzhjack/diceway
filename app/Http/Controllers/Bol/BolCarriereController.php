<?php

namespace App\Http\Controllers\Bol;

use App\Models\Bol\BolCarriere;
use App\Models\Bol\BolHerosCarriere;
use App\Models\Bol\BolHeros;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class BolCarriereController extends Controller
{
    public function getAllCarrieres()
    {
        // Récupérer toutes les lignes de votre modèle
        $donnees = BolCarriere::all();

        // Retourner les données en tant que réponse JSON
        return response()->json($donnees);
    }

    public static function deleteCarriere($herosId, $id)
    {
        $carriere = BolHerosCarriere::where('heros_id', $herosId)->where('carriere_id', $id)->first();
        if (!$carriere) {
            return response()->json(['message' => 'Carrière non trouvée'], 404);
        }
        $carriere->delete();
        return response()->json(['success' => true]);
    }

    public static function updateCarriere($carriereToUpdate, $herosId)
    {
        //$carriereToUpdate = $request->input();
        $carriere = BolHerosCarriere::where('heros_id', $herosId)->where('carriere_id', $carriereToUpdate['carriere_id'])->first();
        if (!$carriere) {
            return response()->json(['message' => 'Carrière non trouvée'], 404);
        }
        BolHerosCarriere::where('id', $carriere['id'])->update($carriereToUpdate);
        return response()->json(['success' => $carriereToUpdate]);
    }

    public function createCarriere(Request $request, $herosId)
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
