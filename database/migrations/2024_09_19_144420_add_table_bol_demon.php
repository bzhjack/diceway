<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_demon', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable()->index(); // null => public profile
            $table->string('nom');
            $table->longText('avatar')->nullable();
            $table->longText('commentaire')->nullable();

            $table->tinyInteger('vigueur')->default(0);
            $table->tinyInteger('agilite')->default(0);
            $table->tinyInteger('esprit')->default(0);
            $table->tinyInteger('aura')->default(0);



            $table->tinyInteger('melee')->default(0);
            $table->tinyInteger('tir')->default(0);
            $table->tinyInteger('defense')->default(0);

            $table->tinyInteger('vitalite')->default(0);
            $table->string('degats')->nullable();
            $table->integer('id_categorie')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_demon');
    }
};
