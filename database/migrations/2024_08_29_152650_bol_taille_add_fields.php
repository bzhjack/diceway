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
        Schema::table('bol_taille', function (Blueprint $table) {
            $table->tinyInteger('vigueur')->default(0);
            $table->tinyInteger('vitalite')->default(0);
            $table->string('degats')->nullable();
            $table->string('deplacement')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_taille');
    }
};
