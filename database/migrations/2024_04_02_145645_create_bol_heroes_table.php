<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bol_heroes', function (Blueprint $table) {
            $table->uuid('id')->primary(); // id du héro
            $table->uuid('user_id')->index(); // id de l'utilisateur
            $table->string('joueur'); // Nom du joueur
            $table->boolean('active'); // 1: Locked 2: Validated

            $table->string('nom'); // Nom du personnage
            // Attributs
            $table->tinyInteger('vigueur');
            $table->tinyInteger('agilite');
            $table->tinyInteger('esprit');
            $table->tinyInteger('aura');
            // Aptitudes de combat
            $table->tinyInteger('initiative');
            $table->tinyInteger('melee');
            $table->tinyInteger('tir');
            $table->tinyInteger('defence');

            // Points
            $table->tinyInteger('vitalite');
            $table->tinyInteger('heroisme');
            $table->tinyInteger('experience');
            $table->tinyInteger('foi');


            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
