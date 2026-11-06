<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** L'ordre d'initiative réordonné à la main n'existe plus : le glisser-déposer du ruban a disparu, et plus rien n'écrit ni ne lit cette colonne. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->dropColumn('ordre_manuel');
        });
    }

    public function down(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->json('ordre_manuel')->nullable();
        });
    }
};
