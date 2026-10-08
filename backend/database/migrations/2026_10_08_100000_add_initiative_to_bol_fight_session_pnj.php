<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /** Initiative du PNJ au moment où il est posé à la table : elle sert de malus au jet de réaction des héros (rivaux et coriaces). */
    public function up(): void
    {
        Schema::table('bol_fight_session_pnj', function (Blueprint $table) {
            $table->tinyInteger('initiative')->default(0)->after('defense');
        });

        DB::statement(
            'UPDATE bol_fight_session_pnj p JOIN bol_heros h ON h.id = p.pnj_id SET p.initiative = h.initiative'
        );
    }

    public function down(): void
    {
        Schema::table('bol_fight_session_pnj', function (Blueprint $table) {
            $table->dropColumn('initiative');
        });
    }
};
