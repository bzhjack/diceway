<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class BolDashboardController extends Controller
{
    public function getCounts()
    {

        // Récupérer le nombre de lignes des tables bol_heros et bol_creatures
        $countHerosPending = DB::table('bol_heros')
            ->where('type', 'H')
            ->where('active', false)
            ->where('user_id', Auth::id())->count();
        $countHeros = DB::table('bol_heros')
            ->where('type', 'H')
            ->where('active', true)
            ->where('user_id', Auth::id())->count();

        $countPnjs = DB::table('bol_heros')
            ->where('type', '!=', 'H')
            ->where('user_id', null)->count();
        $countCreatedPnjs = DB::table('bol_heros')
            ->where('type', '!=', 'H')
            ->where('user_id', Auth::id())->count();
        $countQuest = DB::table('bol_quest')->where('user_id', Auth::id())->count();

        $countCreatures = DB::table('bol_creature')->where('user_id', null)->count();
        $countCreatedCreatures = DB::table('bol_creature')->where('user_id', Auth::id())->count();

        $countDemons = DB::table('bol_demon')->where('user_id', null)->count();
        $countCreatedDemons = DB::table('bol_demon')->where('user_id', Auth::id())->count();
        // Retourner les résultats en format JSON
        return response()->json([
            'countHeros' => $countHeros,
            'countHerosPending' => $countHerosPending,
            'countPnjs' => $countPnjs,
            'countCreatedPnjs' => $countCreatedPnjs,
            'countCreatures' => $countCreatures,
            'countCreatedCreatures' => $countCreatedCreatures,
            'countDemons' => $countDemons,
            'countCreatedDemons' => $countCreatedDemons,
            'countQuest' => $countQuest,
        ]);
    }

}
