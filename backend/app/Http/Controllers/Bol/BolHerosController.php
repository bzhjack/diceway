<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolHerosService;
use App\Http\Requests\Bol\BolHerosRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class BolHerosController extends Controller
{
    protected $bolHerosService;

    public function __construct(BolHerosService $bolHerosService)
    {
        $this->bolHerosService = $bolHerosService;
    }

    /**
     * Récupère tout les héros
     */
    public function getAll()
    {
        $heroes = $this->bolHerosService->getHeroesWithRelations();
        return response($heroes);
    }

    /**
     * Récupère un héro par son id
     */
    public function getOne(Request $request)
    {
        $id = $request->route('id');
        $hero = $this->bolHerosService->getHeroWithRelations($id);
        if ($hero === null || Gate::denies('view', $hero)) {
            return response()->json(['error' => 'Hero not found'], 404);
        }
        return response($hero);
    }

    /**
     * Création d'un héros, depuis le formulaire principal ou l'éditeur avancé : les mêmes règles de création (`BolHerosRequest`).
     */
    public function create(BolHerosRequest $request)
    {
        return response($this->bolHerosService->create($request->input()));
    }

    public function createAdvanced(BolHerosRequest $request)
    {
        return $this->create($request);
    }

    public function updateAdvanced(BolHerosRequest $request)
    {
        return $this->update($request);
    }

    /**
     * Mise à jour d'un héros, depuis le formulaire principal ou l'éditeur avancé.
     */
    public function update(BolHerosRequest $request)
    {
        $hero = $this->bolHerosService->update($request->input());
        if ($hero === null) {
            return response()->json(['error' => 'Hero not found'], 404);
        }
        return response($hero);
    }


    /**
     * Remove the specified resource from storage.
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function delete($id): \Illuminate\Http\JsonResponse
    {
        $bolHeros = $this->bolHerosService->find($id);
        // Check if the resource exists
        if (!$bolHeros || Gate::denies('delete', $bolHeros)) {
            return response()->json(['message' => 'Hero not found'], Response::HTTP_NOT_FOUND);
        }
        if ($this->bolHerosService->enCombat($bolHeros)) {
            return response()->json(['message' => 'Ce héros est en plein combat à une table : terminez d’abord le combat.'], Response::HTTP_CONFLICT);
        }
        // Delete the resource
        $this->bolHerosService->delete($bolHeros);

        // Return a successful response
        return response()->json(['message' => 'Character deleted successfully'], Response::HTTP_OK);
    }

    public function updateOrigines(Request $request, $herosId)
    {
        $bolHeros = $this->bolHerosService->find($herosId);
        // Check if the resource exists
        if (!$bolHeros || Gate::denies('update', $bolHeros)) {
            return response()->json(['message' => 'Hero not found'], Response::HTTP_NOT_FOUND);
        }
        return response($this->bolHerosService->updateOrigines($bolHeros, $request->input()));
    }

    public function adjustHeroisme(Request $request, string $id)
    {
        $heros = $this->bolHerosService->adjustHeroisme($id, Auth::id(), (int) $request->input('delta'));

        if (!$heros) {
            return response()->json(['error' => 'Hero not found'], 404);
        }

        return response()->json($heros);
    }

    /** Points de foi ou de pouvoir dépensés (ou rendus) à la table : un dé de foi, un sort. */
    public function adjustRessource(Request $request, string $id)
    {
        $data = $request->validate(['ressource' => 'required|in:foi,pouvoir', 'delta' => 'required|integer|between:-30,30']);
        $heros = $this->bolHerosService->adjustRessource($id, Auth::id(), $data['ressource'], $data['delta']);

        if (!$heros) {
            return response()->json(['error' => 'Hero not found'], 404);
        }

        return response()->json($heros);
    }

    /** Le prix d'un sort du 3e cercle : 1 point de pouvoir perdu pour toujours, ou 1 point d'attribut. */
    public function perteDefinitive(Request $request, string $id)
    {
        $data = $request->validate(['cible' => 'required|in:pouvoir,vigueur,agilite,esprit,aura']);
        $heros = $this->bolHerosService->perteDefinitive($id, Auth::id(), $data['cible']);

        if (!$heros) {
            return response()->json(['error' => 'Hero not found'], 404);
        }

        return response()->json($heros);
    }

    /** Nomme (ou retire, avec une arme vide) l'arme favorite d'une fiche : l'étoile de la liste d'armes. */
    public function armeFavorite(Request $request, string $id)
    {
        $request->validate(['arme' => 'nullable|string|max:120']);
        $heros = $this->bolHerosService->designerArmeFavorite($id, Auth::id(), $request->input('arme'));

        if ($heros === null) {
            return response()->json(['message' => 'Fiche ou avantage « Arme favorite » introuvable.'], 404);
        }
        if ($heros === false) {
            return response()->json(['message' => 'L’arme favorite de cet avantage régional est imposée par la région.'], 422);
        }

        return response()->json($heros);
    }
}
