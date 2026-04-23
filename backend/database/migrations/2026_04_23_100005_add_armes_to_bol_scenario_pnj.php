<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_scenario_pnj', function (Blueprint $table) {
            $table->json('armes')->nullable()->after('vitalite_courante');
        });
    }

    public function down(): void
    {
        Schema::table('bol_scenario_pnj', function (Blueprint $table) {
            $table->dropColumn('armes');
        });
    }
};
