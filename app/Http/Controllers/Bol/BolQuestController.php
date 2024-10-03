<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolQuest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BolQuestController extends Controller
{
        public function getAll()
        {
            $heroes = BolQuest::where('user_id', Auth::id())->get();
            return response($heroes);
        }
        public function getOne(Request $request)
        {
            $id = $request->route('id');
            $quest = BolQuest::where('user_id', Auth::id())->where('id', $id)->get()->first();
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
            return response()->json(['success' => $updatedQuest]);
        }
}
