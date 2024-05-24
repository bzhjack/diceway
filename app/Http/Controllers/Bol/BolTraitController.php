<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolDesavantage;

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
}
