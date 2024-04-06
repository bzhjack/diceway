<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\BolRegion;
use Illuminate\Http\Request;

class BolRegionController extends Controller
{
    public function getAll()
    {
        // Récupérer toutes les lignes de votre modèle
        $donnees = BolRegion::all();

       // Retourner les données en tant que réponse JSON
        return response()->json($donnees);
    }
}
