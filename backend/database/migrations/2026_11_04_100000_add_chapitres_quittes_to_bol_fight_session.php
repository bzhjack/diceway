<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Les chapitres qu'une table a quittés pour un autre : ils comptent comme joués. Clore une table ne compte plus, puisqu'un MJ qui mène
 * plusieurs compagnies en clôt une pour en reprendre une autre, en plein chapitre. Ce qui était joué le reste : une table déjà close
 * garde son chapitre pour quitté.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->json('chapitres_quittes')->nullable()->after('scenes_jouees');
        });

        DB::table('bol_fight_session')
            ->where('statut', 'terminee')
            ->whereNotNull('scenario_id')
            ->orderBy('id')
            ->each(function (object $session) {
                DB::table('bol_fight_session')->where('id', $session->id)->update(['chapitres_quittes' => json_encode([$session->scenario_id])]);
            });
    }

    public function down(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->dropColumn('chapitres_quittes');
        });
    }
};
