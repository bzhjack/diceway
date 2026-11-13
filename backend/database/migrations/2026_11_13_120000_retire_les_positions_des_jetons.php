<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Les positions des jetons servaient à la battlemap, retirée le 2026-10-23 : la table ne garde plus `positions_jetons`, et la
 * distribution des scènes perd le `positions` de chaque entrée.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('bol_scene')->whereNotNull('distribution')->orderBy('id')->each(function (object $scene) {
            $distribution = json_decode($scene->distribution, true);
            if (!is_array($distribution)) {
                return;
            }
            $sans = array_map(fn ($entree) => is_array($entree) ? array_diff_key($entree, ['positions' => true]) : $entree, $distribution);
            if ($sans !== $distribution) {
                DB::table('bol_scene')->where('id', $scene->id)->update(['distribution' => json_encode($sans)]);
            }
        });

        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->dropColumn('positions_jetons');
        });
    }

    /** La colonne revient vide : les positions ne sont pas rendues. */
    public function down(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->json('positions_jetons')->nullable();
        });
    }
};
