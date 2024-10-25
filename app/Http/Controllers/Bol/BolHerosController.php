<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class BolHerosController extends Controller
{
    /**
     * Récupère tout les héros
     */
    public function getAll()
    {
        $heroes = BolHeros::with('traits.traitable', 'carrieres.carriere', 'armures.armure', 'armes.arme', 'langues.langue','region')
        ->where('type', 'H')
        ->where('user_id', Auth::id())
        ->get();
        return response($heroes);
    }

    /**
     * Récupère un héro par son id
     */
    public function getOne(Request $request)
    {
        $id = $request->route('id');
        $questId = $request->query('questId'); // Récupération de questId si présent
        $hero = BolHeros::with('traits.traitable', 'carrieres.carriere', 'armures.armure', 'armes.arme', 'langues.langue', 'region')->where('user_id', Auth::id())->where('id', $id)->get()->first();
        if ($hero === null) {
            return response()->json(['error' => 'Hero not found'], 404);
        } else {
        if ($questId) {
            $currentQuest =$hero->currentQuest($questId)->first();
            $hero['currentQuest'] = $currentQuest;
        }
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
        $herosId = $request->input('id');

        $data = $request->input();
        $heros['active'] = $data['active'];

        $attributs = $request->input('attributs');
        $heros['vigueur'] = $attributs['vigueur'];
        $heros['agilite'] = $attributs['agilite'];
        $heros['esprit'] = $attributs['esprit'];
        $heros['aura'] = $attributs['aura'];

        $combat = $request->input('combat');
        $heros['initiative'] = $combat['initiative'];
        $heros['melee'] = $combat['melee'];
        $heros['tir'] = $combat['tir'];
        $heros['defense'] = $combat['defense'];

        $origines = $request->input('origines');
        $heros['joueur'] = $origines['joueur'];
        $heros['nom'] = $origines['nom'];
        $heros['region_id'] = $origines['region_id'];
        $heros['avatar'] = $origines['avatar'];
        $heros['commentaire'] = $origines['commentaire'];

        $ressources = $request->input('ressources');
        $heros['vitalite'] = $ressources['vitalite'];
        $heros['heroisme'] = $ressources['heroisme'];
        $heros['foi'] = $ressources['foi'];
        $heros['pouvoir'] = $ressources['pouvoir'];
        $heros['creation'] = $ressources['creation'];

        $hero = BolHeros::where('user_id', Auth::id())->where('id', $herosId)->get()->first();
        if ($hero === null) {
            return response()->json(['error' => 'Hero not found'], 404);
        }
        BolHeros::where('id', $herosId)->update($heros);

        // Maj des carrières
        $carrieres = $request->input('carrieres');
        foreach ($carrieres as $carriere) {
            BolCarriereController::update($carriere, $herosId);
        }

        $traits = $request->input('traits');
        if ($heros["region_id"] === null || count($traits) === 0) {
            BolHerosTrait::where('heros_id', $herosId)->delete();
        }
        $result = BolHeros::with('traits.traitable', 'carrieres.carriere', 'armures.armure', 'armes.arme', 'langues.langue', 'region')->where('user_id', Auth::id())->where('id', $herosId)->get()->first();
        return response($result);
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

        // Suppression en tant que protagonist
        DB::table('bol_quest_protagonist')->where('protagonist_id', $id)->where('type', 'H')->delete();

        // Return a successful response
        return response()->json(['message' => 'Character deleted successfully'], Response::HTTP_OK);
    }

    public function updateOrigines(Request $request, $herosId)
    {
        $bolHeros = BolHeros::find($herosId);
        // Check if the resource exists
        if (!$bolHeros) {
            return response()->json(['message' => 'Hero not found'], Response::HTTP_NOT_FOUND);
        }
        $bolHeros['avatar'] = $request->input('avatar');
        $bolHeros['joueur'] = $request->input('joueur');
        $bolHeros['nom'] = $request->input('nom');
        $bolHeros['region_id'] = $request->input('region_id');
        $bolHeros->update();
        return response($bolHeros);
    }

}
