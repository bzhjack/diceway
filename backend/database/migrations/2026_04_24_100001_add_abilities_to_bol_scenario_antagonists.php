<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_scenario_creature', function (Blueprint $table) {
            $table->json('capacites')->nullable()->after('id_taille');
        });

        Schema::table('bol_scenario_demon', function (Blueprint $table) {
            $table->json('pouvoirs')->nullable()->after('id_taille');
        });
    }

    public function down(): void
    {
        Schema::table('bol_scenario_creature', function (Blueprint $table) {
            $table->dropColumn('capacites');
        });

        Schema::table('bol_scenario_demon', function (Blueprint $table) {
            $table->dropColumn('pouvoirs');
        });
    }
};
