<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Les points de pouvoir perdus pour toujours, un par sort du 3e cercle (livre p. 154) : ils baissent la réserve maximale d'un sorcier
 * (10 + rang de sorcier). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_heros', function (Blueprint $table) {
            $table->unsignedTinyInteger('pouvoir_perdu')->default(0)->after('pouvoir');
        });
    }

    public function down(): void
    {
        Schema::table('bol_heros', function (Blueprint $table) {
            $table->dropColumn('pouvoir_perdu');
        });
    }
};
