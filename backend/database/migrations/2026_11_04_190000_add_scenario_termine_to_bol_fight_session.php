<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Le MJ dit qu'une partie a fini son scénario : rien d'autre ne peut le savoir, on est toujours sur une scène. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->boolean('scenario_termine')->default(false)->after('chapitres_quittes');
        });
    }

    public function down(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->dropColumn('scenario_termine');
        });
    }
};
