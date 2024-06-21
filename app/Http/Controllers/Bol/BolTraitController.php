<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolDesavantage;
use App\Models\Bol\BolHerosTrait;
use Illuminate\Http\Request;

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
                'traitable_type' => $traitable_type,
            ];
            BolHerosTrait::create($heros_traits);
        }
        return response()->json($heros);
    }
}
