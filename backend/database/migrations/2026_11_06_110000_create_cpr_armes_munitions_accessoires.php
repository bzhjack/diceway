<?php

use App\Http\Services\Cpr\CprReferenceCatalogue;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (2/8) : les classes d'armes et les armes exotiques, les munitions, les accessoires d'armes
 * (livre p. 340-349, doc/cyberpunk/resources/armes.md). Lignes du livre : `user_id` null ; un compte pourra y ajouter ses propres objets.
 *
 * Une arme exotique est une variante d'une classe (`base`) : ce qu'elle ne précise pas, elle le tient de sa classe.
 * Les lignes viennent de database/data/cpr/<table>.php, avec leur id fixe (CprReferenceCatalogue, commande cpr:reference).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cpr_arme', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 40)->nullable()->unique(); // lignes du livre
            $table->string('nom', 80);
            $table->string('categorie', 10); // melee, distance, exotique (sans classe)
            $table->foreignId('base_id')->nullable()->constrained('cpr_arme'); // la classe d'une arme exotique
            $table->foreignId('competence_id')->nullable()->constrained('cpr_competence');
            $table->string('degats', 10)->nullable(); // null : pas de dégâts
            $table->unsignedTinyInteger('chargeur')->nullable();
            $table->unsignedTinyInteger('chargeur_extension')->nullable();
            $table->unsignedTinyInteger('chargeur_cylindre')->nullable();
            $table->string('munition', 20)->nullable(); // pistolet_m, pistolet_l, pistolet_tl, slug, fusil, chevrotine, fleche, grenade, roquette, batterie
            $table->unsignedTinyInteger('att_round')->nullable();
            $table->unsignedTinyInteger('mains')->nullable(); // null : selon le modèle (armes de mêlée)
            $table->boolean('dissimulable')->default(false);
            $table->string('qualite', 12)->default('ordinaire'); // mauvaise, ordinaire, excellente
            $table->unsignedInteger('prix');
            $table->unsignedTinyInteger('cor_minimum')->nullable();
            $table->unsignedTinyInteger('ignore_armure_sous')->nullable(); // ignore l'armure de PA inférieur
            $table->json('traits')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        Schema::create('cpr_munition', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 30)->nullable()->unique();
            $table->string('nom', 60);
            $table->unsignedInteger('prix'); // pour 10 ; grenades et roquettes : à l'unité
            $table->json('types'); // les types de munitions qui existent dans cette variété
            $table->text('effet');
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        Schema::create('cpr_accessoire', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 40)->nullable()->unique();
            $table->string('nom', 60);
            $table->unsignedInteger('prix');
            $table->unsignedTinyInteger('emplacements');
            $table->string('compatibilite', 30); // armes_d_epaule, distance, distance_sauf_arcs
            $table->boolean('dissimulable')->default(true); // l'arme reste dissimulable une fois l'accessoire posé
            $table->text('effet');
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        app(CprReferenceCatalogue::class)->synchroniser(['cpr_arme', 'cpr_munition', 'cpr_accessoire']);
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_accessoire');
        Schema::dropIfExists('cpr_munition');
        Schema::dropIfExists('cpr_arme');
        app(CprReferenceCatalogue::class)->oublierLeCache(['cpr_arme', 'cpr_munition', 'cpr_accessoire']);
    }
};
