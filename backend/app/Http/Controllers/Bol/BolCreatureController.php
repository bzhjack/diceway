<?php

namespace App\Http\Controllers\Bol;


use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolCreatureService;
use App\Models\Bol\BolCapacite;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolCreatureCapacite;
use App\Models\Bol\BolTaille;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class BolCreatureController extends Controller
{

    protected $bolCreatureService;

    public function __construct(BolCreatureService $bolCreatureService)
    {
        $this->bolCreatureService = $bolCreatureService;
    }

    public function getAll()
    {
        $cacheKey = 'bol_creatures';
        $cacheDuration = 60 * 24; // 60 minutes
        $creatures = Cache::remember($cacheKey, $cacheDuration, function () {
            return $this->bolCreatureService->getCreaturesWithRelations();
        });
        return response($creatures);
    }

    /**
     * Récupère une créature par son id
     */
    public function getOne(Request $request)
    {
        $id = $request->route('id');
        $creature = $this->bolCreatureService->getCreatureWithRelations($id);
        if ($creature === null) {
            return response()->json(['error' => 'Créature not found'], 404);
        }
        return response($creature);
    }

    public function getAllTailles()
    {
        $cacheKey = 'bol_creatures_tailles';
        $cacheDuration = 60 * 24; // 60 minutes
        $tailles = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolTaille::orderBy('id', 'asc')->get();
        });
        return response($tailles);
    }

    public function getAllCapacites()
    {
        $cacheKey = 'bol_creatures_capacites';
        $cacheDuration = 60 * 24; // 60 minutes
        $capacites = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolCapacite::orderBy('id', 'asc')->get();
        });
        return response($capacites);
    }

    public function create(Request $request)
    {
        Cache::forget('bol_creatures');
        $creature = $request->input();
        $creature['user_id'] = Auth::id();
        $creature = BolCreature::create($creature);
        $capacites = $request->input('capacites');
        foreach ($capacites as $capacite) {
            $newcapa['creature_id'] = $creature['id'];
            $newcapa['capacite_id'] = $capacite['id'];
            $newcapa['detail'] = $capacite['detail'];
            BolCreatureCapacite::create($newcapa);
        }
        $createdCreature = BolCreature::with('taille', 'capacites.capacite')
            ->where('user_id', Auth::id())
            ->where('id', $creature['id'])->get()->first();
        return response($createdCreature);
    }

    public function update(Request $request)
    {
        Cache::forget('bol_creatures');
        $creatureId = $request->input('id');
        $updatedCreature = $request->except(['capacites']);
        $creature = BolCreature::with('taille', 'capacites')
            ->where('user_id', Auth::id())
            ->where('id', $creatureId)->get()->first();

        // Le nouveau tableau de capacités venant de la requête
        $tableau2 = $request->input('capacites');
        $ids_tableau2 = array_column($tableau2, 'id');

        // Supprimer les capacités qui ne sont plus associées à la créature
        BolCreatureCapacite::whereNotIn('capacite_id', $ids_tableau2)
            ->where('creature_id', $creatureId)
            ->delete();

        // Mettre à jour ou insérer les nouvelles capacités
        foreach ($tableau2 as $item) {
            BolCreatureCapacite::updateOrCreate(
                [
                    'creature_id' => $creatureId,
                    'capacite_id' => $item['id']
                ],
                [
                    'detail' => $item['detail']
                ]
            );
        }

        // Mettre à jour les autres champs de la créature
        $creature->update($updatedCreature);
        return response($this->bolCreatureService->getCreatureWithRelations($creatureId));
    }

    public function delete($id): JsonResponse
    {
        Cache::forget('bol_creatures');
        $bolCreature = BolCreature::find($id);
        // Check if the resource exists
        if (!$bolCreature) {
            return response()->json(['message' => 'Creature not found'], Response::HTTP_NOT_FOUND);
        }
        // Delete the resource
        $bolCreature->delete();
        // Return a successful response
        return response()->json(['message' => 'Creature deleted successfully'], Response::HTTP_OK);
    }
}
