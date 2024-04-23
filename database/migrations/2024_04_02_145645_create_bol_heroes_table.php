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
            $table->boolean('active')->default(false); // 1: Locked 2: Validated

            $table->string('nom'); // Nom du personnage
            // Attributs
            $table->tinyInteger('vigueur')->default(0);
            $table->tinyInteger('agilite')->default(0);
            $table->tinyInteger('esprit')->default(0);
            $table->tinyInteger('aura')->default(0);
            // Aptitudes de combat
            $table->tinyInteger('initiative')->default(0);
            $table->tinyInteger('melee')->default(0);
            $table->tinyInteger('tir')->default(0);
            $table->tinyInteger('defence')->default(0);

            // Points
            $table->tinyInteger('vitalite')->default(0);
            $table->tinyInteger('heroisme')->default(0);
            $table->tinyInteger('experience')->default(0);
            $table->tinyInteger('foi')->default(0);


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
