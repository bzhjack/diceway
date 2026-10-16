<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Préparation d'une scène (région, lieu, ambiance, texte à lire, pistes, illustration) et scènes déjà jouées d'une session. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_scene', function (Blueprint $table) {
            $table->foreignId('region_id')->nullable()->after('scenario_id')->constrained('bol_region')->nullOnDelete();
            $table->string('lieu', 120)->nullable()->after('region_id');
            $table->string('moment', 12)->nullable()->after('lieu');
            $table->string('meteo', 12)->nullable()->after('moment');
            $table->unsignedTinyInteger('danger')->nullable()->after('meteo');
            $table->text('lecture')->nullable()->after('danger');
            $table->json('pistes')->nullable()->after('lecture');
            $table->string('image', 500)->nullable()->after('pistes');
        });

        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->json('scenes_jouees')->nullable()->after('scene_id');
        });
    }

    public function down(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->dropColumn('scenes_jouees');
        });

        Schema::table('bol_scene', function (Blueprint $table) {
            $table->dropForeign(['region_id']);
            $table->dropColumn(['region_id', 'lieu', 'moment', 'meteo', 'danger', 'lecture', 'pistes', 'image']);
        });
    }
};
