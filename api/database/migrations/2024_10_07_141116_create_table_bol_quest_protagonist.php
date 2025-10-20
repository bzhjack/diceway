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
        Schema::create('bol_quest_protagonist', function (Blueprint $table) {
            $table->id();
            $table->uuid('quest_id');
            $table->uuid('protagonist_id');
            $table->string('protagonist_type');
            $table->enum('type', ['H', 'P', 'C' ,'D']); // Hero Pnj Creature Demon
            $table->timestamps();

            // Déclaration des clés étrangères
            $table->foreign('quest_id')->references('id')->on('bol_quest')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_quest_protagonist');
    }
};
