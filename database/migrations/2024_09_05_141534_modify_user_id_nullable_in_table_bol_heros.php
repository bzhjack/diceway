<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('bol_heros', function (Blueprint $table) {
            $table->uuid('user_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bol_heros', function (Blueprint $table) {
            // Revenir au champ non nullable
            $table->uuid('user_id')->nullable(false)->change();
        });
    }
};
