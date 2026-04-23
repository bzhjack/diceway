<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_scenario_pnj', function (Blueprint $table) {
            $table->id();
            $table->string('scenario_id', 36);
            $table->string('pnj_id', 36)->nullable();
            $table->string('surnom', 80)->nullable();
            $table->string('nom');

            $table->integer('vigueur');
            $table->integer('agilite');
            $table->integer('esprit');
            $table->integer('aura');

            $table->integer('melee');
            $table->integer('tir');
            $table->integer('defense');

            $table->integer('vitalite_max');
            $table->integer('vitalite_courante');

            $table->foreign('scenario_id')->references('id')->on('bol_scenario')->onDelete('cascade');
            $table->foreign('pnj_id')->references('id')->on('bol_heros')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bol_scenario_pnj');
    }
};
