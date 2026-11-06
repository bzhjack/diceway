<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * La compagnie devient une fiche : un nom et des héros. Une partie (`bol_fight_session`) l'associe à un scénario. Les tables d'avant se
 * rangent sous une compagnie par nom (sans la casse) et par compte, avec les héros de leurs tables, dans l'ordre où ils y sont apparus.
 */
return new class extends Migration
{
    private const SANS_NOM = 'Compagnie sans nom';

    public function up(): void
    {
        Schema::create('bol_compagnie', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('nom');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'nom']);
        });

        Schema::create('bol_compagnie_heros', function (Blueprint $table) {
            $table->id();
            $table->uuid('compagnie_id');
            $table->uuid('heros_id');

            $table->foreign('compagnie_id')->references('id')->on('bol_compagnie')->onDelete('cascade');
            $table->foreign('heros_id')->references('id')->on('bol_heros')->onDelete('cascade');
            $table->unique(['compagnie_id', 'heros_id']);
        });

        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->uuid('compagnie_id')->nullable()->after('user_id');
        });

        $compagnies = [];
        foreach (DB::table('bol_fight_session')->whereNotNull('user_id')->orderBy('created_at')->get(['id', 'user_id', 'titre']) as $session) {
            $nom = trim((string) $session->titre) ?: self::SANS_NOM;
            $cle = $session->user_id . '|' . mb_strtolower($nom);
            $compagnies[$cle] ??= ['id' => $this->creerCompagnie($session->user_id, $nom), 'nom' => $nom];
            DB::table('bol_fight_session')->where('id', $session->id)->update(['compagnie_id' => $compagnies[$cle]['id'], 'titre' => $compagnies[$cle]['nom']]);
            $this->rangerLesHeros($compagnies[$cle]['id'], $session->id, $session->user_id);
        }

        // En dernier : sous SQLite (les tests), poser une clé étrangère recrée la table, ce qui efface en cascade les héros de ses tables.
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->foreign('compagnie_id')->references('id')->on('bol_compagnie')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('bol_fight_session', function (Blueprint $table) {
            $table->dropForeign(['compagnie_id']);
            $table->dropColumn('compagnie_id');
        });
        Schema::dropIfExists('bol_compagnie_heros');
        Schema::dropIfExists('bol_compagnie');
    }

    private function creerCompagnie(string $userId, string $nom): string
    {
        $id = (string) Str::uuid();
        DB::table('bol_compagnie')->insert(['id' => $id, 'user_id' => $userId, 'nom' => $nom, 'created_at' => now(), 'updated_at' => now()]);

        return $id;
    }

    /** Les héros du compte, du camp des héros, assis à cette table : ceux que la compagnie n'a pas encore s'ajoutent à elle. */
    private function rangerLesHeros(string $compagnieId, string $sessionId, string $userId): void
    {
        $heros = DB::table('bol_fight_session_heros')
            ->join('bol_heros', 'bol_heros.id', '=', 'bol_fight_session_heros.heros_id')
            ->where('fight_session_id', $sessionId)
            ->where('camp', 'heros')
            ->where('bol_heros.user_id', $userId)
            ->where('bol_heros.type', 'H')
            ->orderBy('bol_fight_session_heros.id')
            ->pluck('heros_id');
        foreach ($heros as $herosId) {
            DB::table('bol_compagnie_heros')->insertOrIgnore(['compagnie_id' => $compagnieId, 'heros_id' => $herosId]);
        }
    }
};
