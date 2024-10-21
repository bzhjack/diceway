<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolQuest;
use App\Models\Bol\BolQuestProtagonist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BolQuestController extends Controller
{
    public function getAll()
    {
        $heroes = BolQuest::with('protagonists')->where('user_id', Auth::id())->get();
        return response($heroes);
    }

    public function getOne(Request $request)
    {
        $id = $request->route('id');
        $quest = BolQuest::with('protagonists.protagonist')->where('user_id', Auth::id())->where('id', $id)->get()->first();
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

    public static function update(Request $request)
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

    public static function addProtagonist(Request $request)
    {
        $newProtagonist = $request->input();
        $type = $newProtagonist['type'];
        $questId = $newProtagonist['quest_id'];
        $protagonistId = $newProtagonist['protagonist_id'];
        $vitalite =  $newProtagonist['vitalite'];
        $heroisme =  $newProtagonist['heroisme'];
        $vilenie =  $newProtagonist['vilenie'];
        $foi =  $newProtagonist['foi'];
        $creation =  $newProtagonist['creation'];

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
}
