<?php

namespace App\Http\Controllers\Bol;

use App\Models\BolHero;
use Illuminate\Http\Request;

class BolHeroController extends Controller
{
    /**
     * Récupère tout les héros
     */
    public function getAll()
    {
        // Récupérer toutes les lignes de votre modèle
        $donnees = BolHero::all();

       // Retourner les données en tant que réponse JSON
        return response()->json($donnees);
    }
}
