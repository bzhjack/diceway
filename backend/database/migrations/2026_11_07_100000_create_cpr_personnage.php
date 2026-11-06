<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, fiche de personnage (étape 2.1 du plan doc/cyberpunk/plans/2026-11-06-architecture-multi-jeu.md) : le personnage et ses
 * lignes (rôles, compétences, armes, armures, implants, objets). Une fiche appartient à un compte ; elle disparaît avec lui.
 */
return new class extends Migration
{
    private const CARACS = ['int', 'ref', 'dex', 'tech', 'pres', 'vol', 'cha', 'mouv', 'cor', 'emp'];

    public function up(): void
    {
        Schema::create('cpr_personnage', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete(); // null : fiche du catalogue (PNJ du livre)
            $table->string('type', 5)->default('pj'); // pj, pnj
            $table->string('statut', 10)->default('brouillon'); // brouillon, actif
            $table->string('methode', 20)->nullable(); // rat_des_rues, edgerunner, formule_complete
            $table->string('pseudo', 100);
            $table->string('joueur', 100)->nullable();
            $table->longText('avatar')->nullable(); // adresse du portrait (HasPortrait)
            $table->foreignId('role_id')->nullable()->constrained('cpr_role'); // le rôle actuel
            foreach (self::CARACS as $carac) {
                $table->unsignedTinyInteger($carac)->default(2);
            }
            $table->unsignedTinyInteger('profil_jet')->nullable(); // Rat des Rues : la ligne tirée
            $table->smallInteger('humanite')->nullable(); // actuelle ; null : pas encore calculée
            $table->smallInteger('ps')->nullable(); // actuels ; null : au maximum
            $table->unsignedTinyInteger('chance')->nullable(); // restante ; null : pleine
            $table->tinyInteger('reputation')->default(0);
            $table->integer('eddies')->default(0);
            $table->unsignedSmallInteger('pam')->default(0); // points d'amélioration disponibles
            $table->json('parcours')->nullable();
            $table->string('niveau_de_vie', 30)->nullable();
            $table->string('logement', 40)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('cpr_personnage_role', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('personnage_id')->constrained('cpr_personnage')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('cpr_role');
            $table->unsignedTinyInteger('rang')->default(4);
            $table->json('details')->nullable(); // spécialités du Techie et du Medtech, répartition du Solo, garage du Nomade
            $table->unique(['personnage_id', 'role_id']);
        });

        Schema::create('cpr_personnage_competence', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('personnage_id')->constrained('cpr_personnage')->cascadeOnDelete();
            $table->foreignId('competence_id')->constrained('cpr_competence');
            $table->string('precision', 60)->nullable(); // langue, science, forme, lieu, instrument
            $table->unsignedTinyInteger('niveau');
        });

        Schema::create('cpr_personnage_arme', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('personnage_id')->constrained('cpr_personnage')->cascadeOnDelete();
            $table->foreignId('arme_id')->constrained('cpr_arme');
            $table->string('qualite', 12)->default('ordinaire'); // mauvaise, ordinaire, excellente
            $table->json('accessoires')->nullable(); // codes de cpr_accessoire
            $table->string('munition', 30)->nullable(); // code de la variété chargée
            $table->string('notes')->nullable();
        });

        Schema::create('cpr_personnage_armure', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('personnage_id')->constrained('cpr_personnage')->cascadeOnDelete();
            $table->foreignId('armure_id')->constrained('cpr_armure');
            $table->string('localisation', 6)->nullable(); // tete, corps ; null : bouclier, combinaison connectée
            $table->unsignedTinyInteger('pa')->nullable(); // PA actuel (perforations) ; null : intact
            $table->boolean('equipee')->default(true);
        });

        Schema::create('cpr_personnage_cyber', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('personnage_id')->constrained('cpr_personnage')->cascadeOnDelete();
            $table->foreignId('cyber_id')->constrained('cpr_cyber');
            $table->foreignId('parent_id')->nullable()->constrained('cpr_personnage_cyber')->cascadeOnDelete(); // la pièce mère de la fiche
            $table->string('cote', 6)->nullable(); // gauche, droite
            $table->string('precision', 80)->nullable(); // compétence d'une puce, arme escamotée…
            $table->unsignedTinyInteger('ph')->default(0); // perte d'Humanité réellement payée
        });

        Schema::create('cpr_personnage_objet', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('personnage_id')->constrained('cpr_personnage')->cascadeOnDelete();
            $table->string('objet_type', 25); // equipement, programme, munition, vetement, materiel_net, vehicule, amelioration_vehicule
            $table->unsignedBigInteger('objet_id');
            $table->unsignedSmallInteger('quantite')->default(1);
            $table->string('precision', 60)->nullable(); // type de munition, véhicule amélioré…
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_personnage_objet');
        Schema::dropIfExists('cpr_personnage_cyber');
        Schema::dropIfExists('cpr_personnage_armure');
        Schema::dropIfExists('cpr_personnage_arme');
        Schema::dropIfExists('cpr_personnage_competence');
        Schema::dropIfExists('cpr_personnage_role');
        Schema::dropIfExists('cpr_personnage');
    }
};
