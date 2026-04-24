<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_scenario_demon', function (Blueprint $table) {
            $table->dropColumn('id_taille');
        });
    }

    public function down(): void
    {
        Schema::table('bol_scenario_demon', function (Blueprint $table) {
            $table->integer('id_taille')->nullable()->after('degats');
        });
    }
};
