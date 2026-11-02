<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->uuid('scenario_id')->nullable()->after('scene_id');
            $table->foreign('scenario_id')->references('id')->on('bol_scenario')->nullOnDelete();
        });

        // Les tables existantes reprennent le scénario de leur scène courante. Le query builder laisse `updated_at` en paix.
        DB::table('bol_fight_session')->whereNotNull('scene_id')->orderBy('id')->each(function ($session) {
            DB::table('bol_fight_session')->where('id', $session->id)->update([
                'scenario_id' => DB::table('bol_scene')->where('id', $session->scene_id)->value('scenario_id'),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->dropForeign(['scenario_id']);
            $table->dropColumn('scenario_id');
        });
    }
};
