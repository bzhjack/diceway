<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $withAdversaries = DB::table('bol_fight_session')
            ->select('bol_fight_session.id')
            ->distinct()
            ->leftJoin('bol_fight_session_creature', 'bol_fight_session_creature.fight_session_id', '=', 'bol_fight_session.id')
            ->leftJoin('bol_fight_session_demon', 'bol_fight_session_demon.fight_session_id', '=', 'bol_fight_session.id')
            ->leftJoin('bol_fight_session_pnj', 'bol_fight_session_pnj.fight_session_id', '=', 'bol_fight_session.id')
            ->where(function ($query) {
                $query->whereNotNull('bol_fight_session_creature.id')
                    ->orWhereNotNull('bol_fight_session_demon.id')
                    ->orWhereNotNull('bol_fight_session_pnj.id');
            })
            ->pluck('bol_fight_session.id');

        DB::table('bol_fight_session')->whereIn('id', $withAdversaries)->update(['statut' => 'combat']);
        DB::table('bol_fight_session')->whereNotIn('id', $withAdversaries)->update(['statut' => 'libre']);
    }

    public function down(): void
    {
        DB::table('bol_fight_session')->update(['statut' => 'preparation']);
    }
};
