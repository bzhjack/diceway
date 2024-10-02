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
        Schema::create('bol_quest', function (Blueprint $table) {
            $table->uuid('id')->primary(); // id de l'aventure
            $table->uuid('user_id')->index(); // id de l'utilisateur
            $table->string('titre'); // Nom du personnage
            $table->longText('commentaire')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_quest');
    }
};
