<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Retire ce que les suppressions passées ont laissé (références d'import vers une fiche disparue, scénarios sans chapitre), et donne aux
 * fiches la clé étrangère vers leur compte que les autres tables du compte ont déjà. Les clés en dernier : sous SQLite, en ajouter une
 * recrée la table.
 */
return new class extends Migration
{
    private const TABLES_DES_FICHES = ['bol_heros', 'bol_creature', 'bol_demon'];

    private const TABLE_DES_REFERENCES = [
        'pnj'      => 'bol_heros',
        'creature' => 'bol_creature',
        'demon'    => 'bol_demon',
        'scene'    => 'bol_scene',
        'scenario' => 'bol_scenario',
    ];

    public function up(): void
    {
        foreach (self::TABLE_DES_REFERENCES as $kind => $table) {
            DB::table('bol_import_ref')->where('entity_kind', $kind)->whereNotIn('entity_id', DB::table($table)->select('id'))->delete();
        }
        DB::table('bol_saga')->whereNotIn('id', DB::table('bol_scenario')->whereNotNull('saga_id')->select('saga_id'))->delete();

        foreach (self::TABLES_DES_FICHES as $table) {
            // Une fiche dont le compte n'existe plus : personne ne peut la voir (ce n'est pas le catalogue public, sans compte).
            DB::table($table)->whereNotNull('user_id')->whereNotIn('user_id', DB::table('users')->select('id'))->delete();
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            });
        }
    }

    /** Les clés seulement : ce qui a été nettoyé ne citait plus rien. */
    public function down(): void
    {
        foreach (self::TABLES_DES_FICHES as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->dropForeign(['user_id']);
            });
        }
    }
};
