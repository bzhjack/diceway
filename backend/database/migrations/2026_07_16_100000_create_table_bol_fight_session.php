<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_fight_session', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('titre')->nullable();
            $table->string('statut')->default('preparation');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('bol_fight_session_heros', function (Blueprint $table) {
            $table->id();
            $table->uuid('fight_session_id');
            $table->uuid('heros_id');
            $table->string('camp');

            $table->foreign('fight_session_id')->references('id')->on('bol_fight_session')->onDelete('cascade');
            $table->foreign('heros_id')->references('id')->on('bol_heros')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bol_fight_session_heros');
        Schema::dropIfExists('bol_fight_session');
    }
};
