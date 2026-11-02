<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Supprime sept tables que plus rien ne lit :
 * - `bol_race`, `bol_heroic_option` et `bol_difficulte` : listes de référence que le front n'appelle pas
 *   (il a ses propres constantes) ;
 * - `bol_scenario_heros`, `bol_scenario_pnj`, `bol_scenario_creature` et `bol_scenario_demon` : la distribution
 *   d'un scénario, jamais envoyée par le front (les scénarios passent par leurs scènes), toujours vide.
 *
 * `down()` recrée les tables vides, dans leur dernier état ; les listes de référence se remplissent de nouveau
 * avec leurs seeders (BolRaceSeeder, BolHeroicOptionSeeder, BolDifficulteSeeder, dans l'historique git).
 */
return new class extends Migration
{
    private const TABLES = [
        'bol_scenario_heros',
        'bol_scenario_pnj',
        'bol_scenario_creature',
        'bol_scenario_demon',
        'bol_race',
        'bol_heroic_option',
        'bol_difficulte',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::dropIfExists($table);
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('bol_race')) {
            Schema::create('bol_race', function (Blueprint $table) {
                $table->id();
                $table->string('race')->unique();
                $table->text('description')->nullable()->default(null);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('bol_heroic_option')) {
            Schema::create('bol_heroic_option', function (Blueprint $table) {
                $table->id();
                $table->string('label');
                $table->string('slug')->unique();
                $table->text('description');
                $table->unsignedTinyInteger('ordre')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('bol_difficulte')) {
            Schema::create('bol_difficulte', function (Blueprint $table) {
                $table->id();
                $table->string('label');
                $table->tinyInteger('modificateur');
                $table->unsignedTinyInteger('ordre')->default(0);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('bol_scenario_heros')) {
            Schema::create('bol_scenario_heros', function (Blueprint $table) {
                $table->id();
                $table->uuid('scenario_id');
                $table->uuid('heros_id');

                $table->foreign('scenario_id')->references('id')->on('bol_scenario')->onDelete('cascade');
                $table->foreign('heros_id')->references('id')->on('bol_heros')->onDelete('cascade');
            });
        }

        if (!Schema::hasTable('bol_scenario_creature')) {
            Schema::create('bol_scenario_creature', function (Blueprint $table) {
                $table->id();
                $table->uuid('scenario_id');
                $table->uuid('creature_id')->nullable();
                $table->string('surnom')->nullable();
                $table->enum('rang', ['rival', 'coriace', 'pietaille'])->default('coriace');
                $table->string('nom');
                $table->tinyInteger('vigueur')->default(0);
                $table->tinyInteger('agilite')->default(0);
                $table->tinyInteger('esprit')->default(0);
                $table->tinyInteger('vitalite_max')->default(0);
                $table->tinyInteger('vitalite_courante')->default(0);
                $table->tinyInteger('attaque')->default(0);
                $table->tinyInteger('defense')->default(0);
                $table->string('degats')->nullable();
                $table->string('protection')->nullable();
                $table->integer('id_taille')->default(1);
                $table->json('capacites')->nullable();

                $table->foreign('scenario_id')->references('id')->on('bol_scenario')->onDelete('cascade');
                $table->foreign('creature_id')->references('id')->on('bol_creature')->onDelete('set null');
            });
        }

        if (!Schema::hasTable('bol_scenario_demon')) {
            Schema::create('bol_scenario_demon', function (Blueprint $table) {
                $table->id();
                $table->string('scenario_id', 36);
                $table->string('demon_id', 36)->nullable();
                $table->string('surnom', 80)->nullable();
                $table->enum('rang', ['rival', 'coriace', 'pietaille'])->default('coriace');
                $table->string('nom');

                $table->integer('vigueur');
                $table->integer('agilite');
                $table->integer('esprit');
                $table->integer('aura');

                $table->integer('melee');
                $table->integer('tir');
                $table->integer('defense');

                $table->integer('vitalite_max');
                $table->integer('vitalite_courante');

                $table->string('degats')->nullable();
                $table->json('pouvoirs')->nullable();

                $table->foreign('scenario_id')->references('id')->on('bol_scenario')->onDelete('cascade');
                $table->foreign('demon_id')->references('id')->on('bol_demon')->onDelete('set null');
            });
        }

        if (!Schema::hasTable('bol_scenario_pnj')) {
            Schema::create('bol_scenario_pnj', function (Blueprint $table) {
                $table->id();
                $table->string('scenario_id', 36);
                $table->string('pnj_id', 36)->nullable();
                $table->string('surnom', 80)->nullable();
                $table->enum('rang', ['rival', 'coriace', 'pietaille'])->default('coriace');
                $table->string('nom');

                $table->integer('vigueur');
                $table->integer('agilite');
                $table->integer('esprit');
                $table->integer('aura');

                $table->integer('melee');
                $table->integer('tir');
                $table->integer('defense');

                $table->integer('vitalite_max');
                $table->integer('vitalite_courante');
                $table->json('armes')->nullable();

                $table->foreign('scenario_id')->references('id')->on('bol_scenario')->onDelete('cascade');
                $table->foreign('pnj_id')->references('id')->on('bol_heros')->onDelete('set null');
            });
        }
    }
};
