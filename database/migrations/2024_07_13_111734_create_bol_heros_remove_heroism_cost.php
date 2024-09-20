<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
      /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bol_heros', function (Blueprint $table) {
            $table->dropColumn('heroism_cost');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bol_heros', function (Blueprint $table) {
            $table->string('heroism_cost');
        });
    }
};
