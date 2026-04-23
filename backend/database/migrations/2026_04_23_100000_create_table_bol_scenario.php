<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_scenario', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('titre');
            $table->text('pitch')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('bol_scenario_heros', function (Blueprint $table) {
            $table->id();
            $table->uuid('scenario_id');
            $table->uuid('heros_id');

            $table->foreign('scenario_id')->references('id')->on('bol_scenario')->onDelete('cascade');
            $table->foreign('heros_id')->references('id')->on('bol_heros')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bol_scenario_heros');
        Schema::dropIfExists('bol_scenario');
    }
};
