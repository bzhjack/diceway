<?php

namespace App\Http\Services\Bol;

use Illuminate\Support\Facades\DB;

class BolDashboardService
{
    /** Ce que le compte a créé et ce que le catalogue public propose. */
    public function counts(string $userId): array
    {
        return [
            'countHeros' => DB::table('bol_heros')->where('type', 'H')->where('active', true)->where('user_id', $userId)->count(),
            'countHerosPending' => DB::table('bol_heros')->where('type', 'H')->where('active', false)->where('user_id', $userId)->count(),
            'countPnjs' => DB::table('bol_heros')->where('type', '!=', 'H')->where('user_id', null)->count(),
            'countCreatedPnjs' => DB::table('bol_heros')->where('type', '!=', 'H')->where('user_id', $userId)->count(),
            'countCreatures' => DB::table('bol_creature')->where('user_id', null)->count(),
            'countCreatedCreatures' => DB::table('bol_creature')->where('user_id', $userId)->count(),
            'countDemons' => DB::table('bol_demon')->where('user_id', null)->count(),
            'countCreatedDemons' => DB::table('bol_demon')->where('user_id', $userId)->count(),
        ];
    }
}
