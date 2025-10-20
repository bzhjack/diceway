<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolCreatureService;
use App\Http\Services\Bol\BolDemonService;
use App\Http\Services\Bol\BolHerosService;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolQuest;
use App\Models\Bol\BolQuestProtagonist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class BolQuestController extends Controller
{

    protected $bolHerosService;
    protected $bolDemonService;
    protected $bolCreatureService;

    public function __construct(BolHerosService $bolHerosService, BolDemonService $bolDemonService, BolCreatureService $bolCreatureService)
    {
        $this->bolHerosService = $bolHerosService;
        $this->bolCreatureService = $bolCreatureService;
        $this->bolDemonService = $bolDemonService;
    }
    public function getAll()
    {
        $heroes = BolQuest::with('protagonists')->where('user_id', Auth::id())->get();
        return response($heroes);
    }

    public function getOne(Request $request)
    {
        $id = $request->route('id');
        $quest = BolQuest::with('protagonists')->where('user_id', Auth::id())->where('id', $id)->first();
        if ($quest === null) {
            return response()->json(['error' => 'Quest not found'], 404);
        } else {
            return response($quest);
        }
    }

    public function create(Request $request)
    {
        $data = $request->validate([
            'titre' => 'required|max:255'
        ]);
        $quest = $request->input();
        $quest['user_id'] = Auth::id();
        $quest = BolQuest::create($quest);
        return response($quest);
    }

    public function update(Request $request)
    {
        $questId = $request->input('id');
        $updatedQuest = $request->input();
        $quest = BolQuest::where('user_id', Auth::id())->where('id', $questId)->get()->first();

        if (!$quest) {
            return response()->json(['message' => 'Aventure non trouvée'], 404);
        }
        BolQuest::where('id', $questId)->update($updatedQuest);
        return response($updatedQuest);
    }

    public function getOneProtagonist(Request $request)
    {
        $id = $request->route('id');
        $protagonist = BolQuestProtagonist::where('id', $id)->first();
        if ($protagonist === null) {
            return response()->json(['error' => 'Protagonist not found'], 404);
        } else {
            if ($protagonist->type === 'H' || $protagonist->type === 'P') {
                $hero = $this->bolHerosService->getHeroWithRelations($protagonist->protagonist_id);
                $protagonist->protagonist = $hero;
            }
            if ($protagonist->type === 'D') {
                $hero = $this->bolDemonService->getDemonWithRelations($protagonist->protagonist_id);
                $protagonist->protagonist = $hero;
            }
            if ($protagonist->type === 'C') {
                $hero = $this->bolCreatureService->getCreatureWithRelations($protagonist->protagonist_id);
                $protagonist->protagonist = $hero;
            }
            return response($protagonist);
        }
    }

    public function updateProtagonist(Request $request)
    {
        $updatedData = $request->input();
        $id = $updatedData['id'];

        // Recherche de l'enregistrement existant dans `BolQuestProtagonist`
        $questProtagonist = BolQuestProtagonist::where('id', $id)->first();

        if (!$questProtagonist) {
            return response()->json(['message' => 'Protagonist not found'], 404);
        }

        // Mise à jour des champs autorisés
        $questProtagonist->vitalite = $updatedData['vitalite'];
        $questProtagonist->heroisme = $updatedData['heroisme'];
        $questProtagonist->vilenie = $updatedData['vilenie'];
        $questProtagonist->foi = $updatedData['foi'];
        $questProtagonist->creation = $updatedData['creation'];

        // Sauvegarde des modifications
        $questProtagonist->save();

        return response()->json($questProtagonist);
    }

    public function addProtagonist(Request $request)
    {
        $newProtagonist = $request->input();
        $type = $newProtagonist['type'];
        $questId = $newProtagonist['quest_id'];
        $protagonistId = $newProtagonist['protagonist_id'];
        $vitalite = $newProtagonist['vitalite'];
        $heroisme = $newProtagonist['heroisme'];
        $vilenie = $newProtagonist['vilenie'];
        $foi = $newProtagonist['foi'];
        $creation = $newProtagonist['creation'];

        switch ($type) {
            case 'H':
            case 'P':
                $protagonistType = BolHeros::class;
                break;
            case 'D':
                $protagonistType = BolDemon::class;
                break;
            case 'C':
                $protagonistType = BolCreature::class;
                break;
            default:
                $protagonistType = BolHeros::class;

        }
        $quest_protagonist = [
            'quest_id' => $questId,
            'protagonist_id' => $protagonistId,
            'type' => $type,
            'vitalite' => $vitalite,
            'heroisme' => $heroisme,
            'foi' => $foi,
            'creation' => $creation,
            'vilenie' => $vilenie,
            'protagonist_type' => $protagonistType
        ];
        $created = BolQuestProtagonist::create($quest_protagonist);
        return response()->json($created);
    }
    public function deleteProtagonist($id): JsonResponse
    {
        $questProtagonist = BolQuestProtagonist::find($id);
        // Check if the resource exists
        if (!$questProtagonist) {
            return response()->json(['message' => 'Protagonist not found'], Response::HTTP_NOT_FOUND);
        }
        // Delete the resource
        $questProtagonist->delete();

        // Return a successful response
        return response()->json(['message' => 'Protagonist deleted successfully'], Response::HTTP_OK);
    }
}
