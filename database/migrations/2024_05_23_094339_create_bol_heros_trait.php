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
        Schema::create('bol_heros_trait', function (Blueprint $table) {
           $table->id();
           $table->uuid('heros_id');
           $table->unsignedBigInteger('trait_id');
           $table->enum('type', ['A', 'D']);
           $table->timestamps();

           // Déclaration des clés étrangères
           $table->foreign('heros_id')->references('id')->on('bol_heros')->onDelete('cascade');

           // On s'assure qu'une combinaison de region_id et avantage_id soit unique
           $table->unique(['heros_id', 'trait_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_heros_trait');
    }
};
