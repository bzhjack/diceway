<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Un héros peut tomber sous 0 (vitalité négative = "Défier la mort", 02-actions-combat.md) — la
 * colonne était unsignedInteger, ce qui rendait toute valeur négative impossible à persister.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_fight_session_heros', function (Blueprint $table) {
            $table->integer('vitalite_courante')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('bol_fight_session_heros', function (Blueprint $table) {
            $table->unsignedInteger('vitalite_courante')->nullable()->change();
        });
    }
};
