<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_heroic_option', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('slug')->unique();
            $table->text('description');
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bol_heroic_option');
    }
};
