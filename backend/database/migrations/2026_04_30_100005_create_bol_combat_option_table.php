<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_combat_option', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('slug')->unique();
            $table->tinyInteger('modificateur')->default(0);
            $table->boolean('modificateur_armor')->default(false);
            $table->string('note')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bol_combat_option');
    }
};
