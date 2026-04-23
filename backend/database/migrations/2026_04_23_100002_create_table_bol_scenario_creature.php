<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_scenario_creature', function (Blueprint $table) {
            $table->id();
            $table->uuid('scenario_id');
            $table->uuid('creature_id')->nullable();
            $table->string('surnom')->nullable();
            $table->string('nom');
            $table->tinyInteger('vigueur')->default(0);
            $table->tinyInteger('agilite')->default(0);
            $table->tinyInteger('esprit')->default(0);
            $table->tinyInteger('vitalite_max')->default(0);
            $table->tinyInteger('vitalite_courante')->default(0);
            $table->tinyInteger('attaque')->default(0);
            $table->tinyInteger('defense')->default(0);
            $table->string('degats')->nullable();
            $table->string('protection')->nullable();
            $table->integer('id_taille')->default(1);

            $table->foreign('scenario_id')->references('id')->on('bol_scenario')->onDelete('cascade');
            $table->foreign('creature_id')->references('id')->on('bol_creature')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bol_scenario_creature');
    }
};
