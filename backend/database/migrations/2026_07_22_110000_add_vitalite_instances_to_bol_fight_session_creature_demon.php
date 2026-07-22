<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Un lot de créatures/démons (qty > 1) partageait un unique `vitalite_courante` pour tout le
 * groupe : infliger des dégâts à une seule instance sur la battlemap affectait donc tous ses clones.
 * `vitalite_instances` stocke un tableau de PV courants, un par instance du lot.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_fight_session_creature', function (Blueprint $table) {
            $table->json('vitalite_instances')->nullable()->after('vitalite_courante');
        });

        Schema::table('bol_fight_session_demon', function (Blueprint $table) {
            $table->json('vitalite_instances')->nullable()->after('vitalite_courante');
        });
    }

    public function down(): void
    {
        Schema::table('bol_fight_session_creature', function (Blueprint $table) {
            $table->dropColumn('vitalite_instances');
        });

        Schema::table('bol_fight_session_demon', function (Blueprint $table) {
            $table->dropColumn('vitalite_instances');
        });
    }
};
