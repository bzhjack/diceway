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
        Schema::create('bol_demon_pouvoir', function (Blueprint $table) {
            $table->id();
            $table->uuid('demon_id');
            $table->unsignedBigInteger('pouvoir_id');
            $table->text('detail')->nullable()->default(null);
            $table->timestamps();

            // Déclaration des clés étrangères
            $table->foreign('demon_id')->references('id')->on('bol_demon')->onDelete('cascade');

            // On s'assure qu'une combinaison de region_id et avantage_id soit unique
            $table->unique(['demon_id', 'pouvoir_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_demon_pouvoir');
    }
};
