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
        Schema::table('bol_quest_protagonist', function (Blueprint $table) {
           $table->tinyInteger('vitalite')->default(0);
           $table->tinyInteger('heroisme')->default(0);
           $table->tinyInteger('vilenie')->default(0);
           $table->tinyInteger('foi')->default(0);
           $table->tinyInteger('creation')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bol_quest_protagonist', function (Blueprint $table) {
            Schema::dropIfExists('bol_quest_protagonist');
        });
    }
};
