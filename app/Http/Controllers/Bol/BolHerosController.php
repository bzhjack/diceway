<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolHeros;
use App\Models\bol\BolHerosCarriere;
use App\Models\Bol\BolHerosTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class BolHerosController extends Controller
{
    /**
     * Récupère tout les héros
     */
    public function getAll()
    {
        $heroes = BolHeros::with('traits.traitable', 'carrieres.carriere', 'armures.armure', 'armes.arme')->where('user_id', Auth::id())->get();
        return response($heroes);
    }

    /**
     * Récupère un héro par son id
     */
    public function getOne(Request $request)
    {
        $id = $request->route('id');
        $hero = BolHeros::with('traits.traitable', 'carrieres.carriere', 'armures.armure', 'armes.arme')->where('user_id', Auth::id())->where('id', $id)->get()->first();
        if ($hero === null) {
            return response()->json(['error' => 'Hero not found'], 404);
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
        $heros = $request->input();
        $heros['user_id'] = Auth::id();
        $heros = BolHeros::create($heros);
        return response($heros);
    }

    /**
     * Mise à jour d'un hero
     */
    public function update(Request $request)
    {
        $heros = $request->except('traits', 'carrieres', 'armures', 'armes');
        $traits = $request->input('traits');
        $carrieres = $request->input('carrieres');
        $herosId = $heros['id'];
        $hero = BolHeros::where('user_id', Auth::id())->where('id', $herosId)->get()->first();
        if ($hero === null) {
            return response()->json(['error' => 'Hero not found'], 404);
        }
        BolHeros::where('id', $herosId)->update($heros);
        // Maj des carrières
        foreach ($carrieres as $carriere) {
            BolCarriereController::update($carriere, $herosId);
        }
        if ($heros["region_id"] === null || count($traits) === 0) {
            BolHerosTrait::where('heros_id', $herosId)->delete();
        }
        return response($heros);
    }


    /**
     * Remove the specified resource from storage.
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function delete($id): \Illuminate\Http\JsonResponse
    {
        $bolHeros = BolHeros::find($id);
        // Check if the resource exists
        if (!$bolHeros) {
            return response()->json(['message' => 'Hero not found'], Response::HTTP_NOT_FOUND);
        }
        // Delete the resource
        $bolHeros->delete();
        // Return a successful response
        return response()->json(['message' => 'Hero deleted successfully'], Response::HTTP_OK);
    }

}
