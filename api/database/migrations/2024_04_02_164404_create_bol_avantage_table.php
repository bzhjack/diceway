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
        Schema::create('bol_avantage', function (Blueprint $table) {
            $table->id();
            $table->string('avantage')->unique();
            $table->string('attribut')->nullable()->default(null);
            $table->tinyInteger('attribut_bonus')->nullable()->default(null);
            $table->boolean('de_bonus')->default(false);
            $table->text('de_bonus_domaine')->nullable()->default(null);
            $table->text('description')->nullable()->default(null);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_avantage');
    }
};
