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
        Schema::create('bol_region_avantages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('region_id');
            $table->unsignedBigInteger('avantage_id');
            $table->string('detail')->nullable()->default(null);
            $table->timestamps();

            // Déclaration des clés étrangères
            $table->foreign('region_id')->references('id')->on('bol_regions')->onDelete('cascade');

            // On s'assure qu'une combinaison de region_id et avantage_id soit unique
            $table->unique(['region_id', 'avantage_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_regions_avantages');
    }
};
