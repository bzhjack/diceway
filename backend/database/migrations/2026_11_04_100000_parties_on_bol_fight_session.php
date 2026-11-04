<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Les tables deviennent des parties qu'on reprend quand on veut : une date de dernière partie jouée (`jouee_le`, d'abord la dernière
 * activité connue) et plus de clôture. `terminee` redevient `libre`, et ce que la clôture avait marqué joué ne compte plus : un chapitre est
 * joué pour une partie quand elle l'a quitté, ou quand elle en a joué toutes les scènes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->timestamp('jouee_le')->nullable()->after('chapitres_quittes');
        });

        DB::table('bol_fight_session')->update(['jouee_le' => DB::raw('updated_at')]);
        DB::table('bol_fight_session')->where('statut', 'terminee')->update(['statut' => 'libre', 'chapitres_quittes' => null]);
    }

    public function down(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->dropColumn('jouee_le');
        });
    }
};
