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
        Schema::create('bol_armes', function (Blueprint $table) {
            $table->id();
            $table->string('arme');
            $table->enum('type', ['M', 'T']); // Utilisation de 'M' pour mêlée et 'T' pour tir
            $table->string('degats');
            $table->string('portee')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_armes');
    }
};
