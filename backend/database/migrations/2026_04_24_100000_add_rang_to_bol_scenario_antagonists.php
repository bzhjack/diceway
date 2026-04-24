<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['bol_scenario_creature', 'bol_scenario_demon', 'bol_scenario_pnj'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->enum('rang', ['rival', 'coriace', 'pietaille'])->default('coriace')->after('surnom');
            });
        }
    }

    public function down(): void
    {
        foreach (['bol_scenario_creature', 'bol_scenario_demon', 'bol_scenario_pnj'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn('rang');
            });
        }
    }
};
