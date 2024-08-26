<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('bol_creature', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->nullable()->index(); // null => public profile
            $table->string('nom');
            $table->tinyInteger('vigueur')->default(0);
            $table->tinyInteger('agilite')->default(0);
            $table->tinyInteger('esprit')->default(0);
            $table->tinyInteger('vitalite')->default(0);
            $table->tinyInteger('attaque')->default(0);
            $table->tinyInteger('defense')->default(0);
            $table->string('degat')->nullable();
            $table->string('protection')->nullable();
            $table->longText('avatar')->nullable();
            $table->integer('id_taille')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_creature');
    }
};
