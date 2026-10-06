<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Par défaut une arme est équipée : les armes déjà possédées le deviennent toutes, ce qui garde le
        // comportement actuel (toutes proposées à l'attaque) tant que le MJ n'en déséquipe pas.
        Schema::table('bol_heros_arme', function (Blueprint $table) {
            $table->boolean('equipee')->default(true)->after('arme_id');
        });
    }

    public function down(): void
    {
        Schema::table('bol_heros_arme', function (Blueprint $table) {
            $table->dropColumn('equipee');
        });
    }
};
