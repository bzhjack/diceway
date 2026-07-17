<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_fight_session_creature', function (Blueprint $table) {
            $table->id();
            $table->uuid('fight_session_id');
            $table->uuid('creature_id')->nullable();
            $table->string('camp');
            $table->unsignedTinyInteger('qty')->default(1);
            $table->string('surnom', 80)->nullable();
            $table->enum('rang', ['rival', 'coriace', 'pietaille'])->default('coriace');
            $table->string('nom');

            $table->integer('vigueur');
            $table->integer('agilite');
            $table->integer('esprit');

            $table->integer('attaque');
            $table->integer('defense');

            $table->integer('vitalite_max');
            $table->integer('vitalite_courante');

            $table->string('degats')->nullable();
            $table->string('protection')->nullable();
            $table->integer('id_taille')->default(1);
            $table->json('capacites')->nullable();

            $table->foreign('fight_session_id')->references('id')->on('bol_fight_session')->onDelete('cascade');
            $table->foreign('creature_id')->references('id')->on('bol_creature')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bol_fight_session_creature');
    }
};
