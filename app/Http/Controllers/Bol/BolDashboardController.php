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
        $countHeros = DB::table('bol_heros')
            ->where('type', 'H')
            ->where('user_id', Auth::id())->count();

        $countPnjs = DB::table('bol_heros')
            ->where('type', '!=', 'H')
            ->where('user_id', Auth::id())
            ->orWhereNull('user_id')->count();

        $countCreatures = DB::table('bol_creature')->count();

        // Retourner les résultats en format JSON
        return response()->json([
            'countHeros' => $countHeros,
            'countCreatures' => $countCreatures,
            'countPnjs' => $countPnjs
        ]);
    }

}
