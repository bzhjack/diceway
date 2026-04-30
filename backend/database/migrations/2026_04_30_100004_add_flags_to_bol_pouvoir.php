<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_pouvoir', function (Blueprint $table) {
            $table->boolean('avantage_attaque')->default(false)->after('description');
            $table->boolean('degats_superieurs')->default(false)->after('avantage_attaque');
            $table->boolean('regeneration')->default(false)->after('degats_superieurs');
            $table->boolean('intangible')->default(false)->after('regeneration');
            $table->boolean('avertissement_combat')->default(false)->after('intangible');
        });
    }

    public function down(): void
    {
        Schema::table('bol_pouvoir', function (Blueprint $table) {
            $table->dropColumn(['avantage_attaque', 'degats_superieurs', 'regeneration', 'intangible', 'avertissement_combat']);
        });
    }
};
