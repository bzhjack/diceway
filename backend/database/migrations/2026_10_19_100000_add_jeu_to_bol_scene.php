<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** « En jeu » d'une scène : ses règles pour le MJ (jets, difficultés, tables d'effets), visibles pendant toute la scène. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_scene', function (Blueprint $table) {
            $table->text('jeu')->nullable()->after('lecture');
        });
    }

    public function down(): void
    {
        Schema::table('bol_scene', function (Blueprint $table) {
            $table->dropColumn('jeu');
        });
    }
};
