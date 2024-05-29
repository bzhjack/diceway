<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BolHerosController extends Controller
{
    /**
     * Récupère tout les héros
     */
    public function getAll()
    {
        $heroes = BolHeros::with('traits')->where('user_id', Auth::id())->get();
        return response($heroes);
    }

    /**
     * Récupère un héro par son id
     */
    public function getOne(Request $request) {
        $id = $request->route('id');
        $hero = BolHeros::with('traits')->where('user_id', Auth::id())->where('id', $id)->get()->first();
        if ($hero === null) {
            return response()->json(['error'=> 'Hero not found'], 404);
        } else {
            return response($hero);
        }
    }
    /**
     * Création d'un hero
     */
    public function create(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|max:255',
            'joueur' => 'required|max:255'
        ]);
        $heros = $request->except('traits');
        $traits = $request->input('traits');
        $heros['user_id'] = Auth::id();
        $heros = BolHeros::create($heros);
        $id =  $heros->id;

        BolHerosController::updateTraits($id, $traits);
        return response($heros);
    }
    /**
     * Mise à jour d'un hero
     */
    public function update(Request $request)
    {
        $heros = $request->except('traits');
        $traits = $request->input('traits');
        $id = $heros['id'];
        $hero = BolHeros::where('user_id', Auth::id())->where('id', $id)->get()->first();
        if ($hero === null) {
            return response()->json(['error'=> 'Hero not found'], 404);
        } else {
            BolHeros::where('id', $id)->update($heros);
            BolHerosController::updateTraits($id, $traits);
            return response($heros);
        }
    }

    public static function updateTraits($id, $traits)
    {
        // Supprimez les traits existants pour le héros donné
        BolHerosTrait::where('heros_id', $id)->delete();

        // Insérez les nouveaux traits
        foreach ($traits as $trait) {
            $heros_traits = [
                'heros_id' => $id,
                'trait_id' => $trait['trait_id'],
                'type' => $trait['type'],
            ];
            BolHerosTrait::create($heros_traits);
        }
    }

}
