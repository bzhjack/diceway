<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bol_heros_armure', function (Blueprint $table) {
            $table->boolean('equipee')->default(false)->after('armure_id');
        });

        // Préserve le comportement actuel ("premier élément de la liste compte") comme état de
        // départ : marque équipé le pivot le plus ancien par héros et par catégorie d'armure.
        DB::statement(<<<'SQL'
            UPDATE bol_heros_armure bha
            JOIN bol_armure a ON a.id = bha.armure_id
            JOIN (
                SELECT MIN(bha2.id) AS min_id
                FROM bol_heros_armure bha2
                JOIN bol_armure a2 ON a2.id = bha2.armure_id
                WHERE a2.categorie IS NOT NULL
                GROUP BY bha2.heros_id, a2.categorie
            ) first_per_category ON first_per_category.min_id = bha.id
            SET bha.equipee = true
        SQL);
    }

    public function down(): void
    {
        Schema::table('bol_heros_armure', function (Blueprint $table) {
            $table->dropColumn('equipee');
        });
    }
};
