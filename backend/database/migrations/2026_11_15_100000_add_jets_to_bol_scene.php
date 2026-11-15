<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Les jets d'une scène : une liste structurée (titre, attributs, difficulté, enjeu, échec…), saisie dans « Préparer la scène » ou
 * importée, à côté de la mise en scène (`jeu`), qui reste un texte libre. Voir `BolSceneJets`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_scene', function (Blueprint $table) {
            $table->json('jets')->nullable()->after('jeu');
        });
    }

    public function down(): void
    {
        Schema::table('bol_scene', function (Blueprint $table) {
            $table->dropColumn('jets');
        });
    }
};
