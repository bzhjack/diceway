<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('bol_quest_protagonist');
        Schema::dropIfExists('bol_quest');
    }

    public function down(): void
    {
        Schema::create('bol_quest', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('nom')->nullable();
            $table->timestamps();
        });

        Schema::create('bol_quest_protagonist', function (Blueprint $table) {
            $table->id();
            $table->uuid('quest_id');
            $table->uuid('protagonist_id');
            $table->string('type');
            $table->timestamps();
        });
    }
};
