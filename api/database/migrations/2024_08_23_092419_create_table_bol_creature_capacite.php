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
        Schema::create('bol_creature_capacite', function (Blueprint $table) {
            $table->id();
            $table->uuid('creature_id');
            $table->unsignedBigInteger('capacite_id');
            $table->text('detail')->nullable()->default(null);
            $table->timestamps();

            // Déclaration des clés étrangères
            $table->foreign('creature_id')->references('id')->on('bol_creature')->onDelete('cascade');

            // On s'assure qu'une combinaison de region_id et avantage_id soit unique
            $table->unique(['creature_id', 'capacite_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_creature_capacite');
    }
};
