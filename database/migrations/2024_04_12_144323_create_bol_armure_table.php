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
        Schema::create('bol_armure', function (Blueprint $table) {
            $table->id();
            $table->string('armure');
            $table->string('protection');
            $table->string('malus')->nullable();
            $table->string('pts_de_pouvoir')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bol_armure');
    }
};
