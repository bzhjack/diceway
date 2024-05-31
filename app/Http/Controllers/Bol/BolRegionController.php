<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolRegion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
    public function getOne(Request $request) {
        $id = $request->route('id');
        $hero = BolRegion::with('avantages', 'desavantages', 'noms')->where('id', $id)->get()->first();
        if ($hero === null) {
            return response()->json(['error'=> 'Country not found'], 404);
        } else {
            return response($hero);
        }
    }
}
