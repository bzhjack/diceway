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

         public static function update(Request $request)
         {
             $heros = $request->except('traits', 'carrieres');
             $carrieres = $request->input('carrieres');
             $id = $heros["id"];
             // Supprimez les traits existants pour le héros donné
             BolHerosCarriere::where('heros_id', $id)->delete();
             // Insérez les nouveaux traits
             foreach ($carrieres as $carriere) {
                 $heros_carrieres = [
                     'heros_id' => $id,
                     'carriere_id' => $carriere['carriere_id'],
                     'value' => $carriere['value'],
                 ];
                 BolHerosCarriere::create($heros_carrieres);
             }
             return response()->json($heros);
         }
}
