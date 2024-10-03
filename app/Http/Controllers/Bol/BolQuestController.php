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
}
