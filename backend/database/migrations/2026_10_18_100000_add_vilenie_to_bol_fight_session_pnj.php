<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Points de vilénie d'un PNJ rival posé à la table (null pour un coriace ou une piétaille). Les rivaux déjà posés reçoivent
 * ceux de leur fiche. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_fight_session_pnj', function (Blueprint $table) {
            $table->unsignedTinyInteger('vilenie_courante')->nullable()->after('vitalite_courante');
        });

        DB::table('bol_fight_session_pnj')
            ->where('rang', 'rival')
            ->update(['vilenie_courante' => DB::raw('COALESCE((SELECT h.vilenie FROM bol_heros h WHERE h.id = bol_fight_session_pnj.pnj_id), 0)')]);
    }

    public function down(): void
    {
        Schema::table('bol_fight_session_pnj', function (Blueprint $table) {
            $table->dropColumn('vilenie_courante');
        });
    }
};
