<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolRegion;

class BolRegionController extends Controller
{
    /**
     * Récupère toutes les régions
     */
    public function getAll()
    {
        // Récupérer toutes les lignes de votre modèle
        $donnees = BolRegion::with('avantages', 'desavantages', 'noms')->get();

       // Retourner les données en tant que réponse JSON
        return response()->json($donnees);
    }
}
