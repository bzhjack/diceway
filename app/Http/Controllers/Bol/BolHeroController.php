<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolHero;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BolHeroController extends Controller
{
    /**
     * Récupère tout les héros
     */
    public function getAll()
    {
        $heroes = BolHero::where('user_id', Auth::id())->get();
        return response($heroes);
    }

    /**
     * Récupère un héro par son id
     */
    public function getOne(Request $request) {
        $id = $request->route('id');
        $hero = BolHero::where('user_id', Auth::id())->where('id', $id)->get()->first();
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
        $input = $request->all();
        $input['user_id'] = Auth::id();
        $hero = BolHero::create($input);
        return response($hero);
    }
    /**
     * Mise à jour d'un hero
     */
    public function update(Request $request)
    {
        $input = $request->all();
        $id = $input['id'];
        $hero = BolHero::where('user_id', Auth::id())->where('id', $id)->get()->first();
        if ($hero === null) {
            return response()->json(['error'=> 'Hero not found'], 404);
        } else {
            BolHero::where('id', $id)->update($input);
            return response($input);
        }
    }
}
