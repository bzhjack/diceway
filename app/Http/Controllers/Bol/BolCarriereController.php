<?php

namespace App\Http\Controllers\Bol;
use App\Models\Bol\BolCarriere;
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
}
