<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bol_scene', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->uuid('scenario_id')->nullable();
            $table->string('titre', 120);
            $table->unsignedInteger('ordre')->default(0);
            $table->text('notes')->nullable();
            $table->json('distribution');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('scenario_id')->references('id')->on('bol_scenario')->nullOnDelete();
        });

        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->uuid('scene_id')->nullable()->after('positions_jetons');
            $table->foreign('scene_id')->references('id')->on('bol_scene')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->dropForeign(['scene_id']);
            $table->dropColumn('scene_id');
        });

        Schema::dropIfExists('bol_scene');
    }
};
