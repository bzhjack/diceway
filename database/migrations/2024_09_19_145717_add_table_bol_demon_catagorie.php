<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('bol_categorie', function (Blueprint $table) {
            $table->id();
            $table->string('categorie');
            $table->enum('type', ['P', 'C', 'R'])->nullable();
            $table->tinyInteger('pouvoirs')->default(0);
            $table->tinyInteger('vitalite')->default(0);
            $table->string('degats')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_categorie');
    }
};
