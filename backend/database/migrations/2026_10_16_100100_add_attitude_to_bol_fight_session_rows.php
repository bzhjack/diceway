<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Attitude envers les héros d'un PNJ, d'une créature ou d'un démon posé sur la table. */
return new class extends Migration
{
    private const TABLES = ['bol_fight_session_pnj', 'bol_fight_session_creature', 'bol_fight_session_demon'];

    public function up(): void
    {
        foreach (self::TABLES as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->string('attitude', 10)->nullable()->after('camp');
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $name) {
            Schema::table($name, function (Blueprint $table) {
                $table->dropColumn('attitude');
            });
        }
    }
};
