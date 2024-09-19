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
        Schema::create('bol_pouvoir', function (Blueprint $table) {
            $table->id();
            $table->string('capacite')->unique();
            $table->boolean('de_bonus')->default(false);
            $table->boolean('de_malus')->default(false);
            $table->text('description')->nullable()->default(null);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_pouvoir');
    }
};
