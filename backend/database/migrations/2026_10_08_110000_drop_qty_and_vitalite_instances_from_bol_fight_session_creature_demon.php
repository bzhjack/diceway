<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /** Une ligne = une carte : plus de lots (`qty`) ni de vitalité par exemplaire (`vitalite_instances`). */
    public function up(): void
    {
        foreach (['bol_fight_session_creature', 'bol_fight_session_demon'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn(['qty', 'vitalite_instances']);
            });
        }
    }

    public function down(): void
    {
        foreach (['bol_fight_session_creature', 'bol_fight_session_demon'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->unsignedInteger('qty')->default(1);
                $t->json('vitalite_instances')->nullable();
            });
        }
    }
};
