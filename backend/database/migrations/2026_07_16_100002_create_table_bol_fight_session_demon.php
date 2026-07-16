<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_fight_session_demon', function (Blueprint $table) {
            $table->id();
            $table->uuid('fight_session_id');
            $table->uuid('demon_id')->nullable();
            $table->string('camp');
            $table->unsignedTinyInteger('qty')->default(1);
            $table->string('surnom', 80)->nullable();
            $table->enum('rang', ['rival', 'coriace', 'pietaille'])->default('rival');
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

            $table->string('degats')->nullable();
            $table->json('pouvoirs')->nullable();

            $table->foreign('fight_session_id')->references('id')->on('bol_fight_session')->onDelete('cascade');
            $table->foreign('demon_id')->references('id')->on('bol_demon')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bol_fight_session_demon');
    }
};
