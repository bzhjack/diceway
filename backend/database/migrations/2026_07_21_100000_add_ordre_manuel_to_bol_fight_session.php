<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->json('ordre_manuel')->nullable()->after('statut');
        });
    }

    public function down(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->dropColumn('ordre_manuel');
        });
    }
};
