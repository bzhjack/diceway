<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** La foi et la sorcellerie en combat (livre p. 146-157) : un PNJ posé à une table dépense ses points de foi et de pouvoir sur sa ligne,
 * comme sa vilénie (il peut y être posé en plusieurs exemplaires, qui ne partagent pas leur réserve). Les lignes déjà posées partent de
 * leur fiche ; `null` : pas de réserve. Un héros, lui, les dépense sur sa fiche, comme son héroïsme : rien à ajouter pour lui. */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('bol_fight_session_pnj', 'foi_courante')) {
            Schema::table('bol_fight_session_pnj', function (Blueprint $t) {
                $t->smallInteger('foi_courante')->nullable();
                $t->smallInteger('pouvoir_courant')->nullable();
            });

            DB::table('bol_fight_session_pnj')
                ->join('bol_heros', 'bol_heros.id', '=', 'bol_fight_session_pnj.pnj_id')
                ->select('bol_fight_session_pnj.id', 'bol_heros.foi', 'bol_heros.pouvoir')
                ->orderBy('bol_fight_session_pnj.id')
                ->get()
                ->each(fn ($ligne) => DB::table('bol_fight_session_pnj')->where('id', $ligne->id)->update([
                    'foi_courante'    => $ligne->foi > 0 ? (int) $ligne->foi : null,
                    'pouvoir_courant' => $ligne->pouvoir > 0 ? (int) $ligne->pouvoir : null,
                ]));
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('bol_fight_session_pnj', 'foi_courante')) {
            Schema::table('bol_fight_session_pnj', function (Blueprint $t) {
                $t->dropColumn(['foi_courante', 'pouvoir_courant']);
            });
        }
    }
};
