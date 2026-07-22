<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_fight_session_heros', function (Blueprint $table) {
            $table->unsignedInteger('vitalite_courante')->nullable()->after('initiative_resultat');
        });
    }

    public function down(): void
    {
        Schema::table('bol_fight_session_heros', function (Blueprint $table) {
            $table->dropColumn('vitalite_courante');
        });
    }
};
