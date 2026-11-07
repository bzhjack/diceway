<?php

use App\Http\Services\Cpr\CprReferenceCatalogue;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (1/8) : les rôles, les compétences, les 20 compétences de chaque rôle avec leur niveau au Rat des
 * Rues, et les tables de CARAC des rôles. Les tables sont créées et remplies ici, d'après le livre de base (doc/cyberpunk/resources/roles.md,
 * doc/cyberpunk/rules/02-competences-et-resolution.md) : un `migrate` suffit sur chaque poste.
 * Les lignes viennent de database/data/cpr/<table>.php, avec leur id fixe (CprReferenceCatalogue, commande cpr:reference).
 */
return new class extends Migration
{
    private const CARACS = ['int', 'ref', 'dex', 'tech', 'pres', 'vol', 'cha', 'mouv', 'cor', 'emp'];

    public function up(): void
    {
        Schema::create('cpr_role', function (Blueprint $table) {
            $table->id();
            $table->string('code', 30)->unique();
            $table->string('nom', 50);
            $table->string('capacite', 50); // la capacité de rôle
            $table->string('resume')->nullable();
            $table->unsignedTinyInteger('ordre');
            $table->timestamps();
        });

        Schema::create('cpr_competence', function (Blueprint $table) {
            $table->id();
            $table->string('code', 60)->unique();
            $table->string('nom', 60);
            $table->string('carac', 4); // int, ref, dex, tech, pres, vol, cha, mouv, cor, emp
            $table->string('categorie', 20); // vigilance, corps, controle, education, combat, tir, representation, sociabilite, technique
            $table->unsignedTinyInteger('cout')->default(1); // 2 : compétence (x2), deux fois plus chère
            $table->boolean('de_base')->default(false); // niveau 2 minimum à la création
            $table->string('precision_de_base', 40)->nullable(); // Langue (argot), Guide local (quartier d'origine)
            $table->string('specialite', 20)->nullable(); // langue, lieu, domaine, forme, instrument : à préciser à chaque achat
            $table->foreignId('reservee_role_id')->nullable()->constrained('cpr_role'); // Chirurgie, Techniques médicales : Medtech
            $table->string('note')->nullable();
            $table->unsignedTinyInteger('ordre');
            $table->timestamps();
        });

        Schema::create('cpr_role_competence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('cpr_role')->cascadeOnDelete();
            $table->foreignId('competence_id')->constrained('cpr_competence')->cascadeOnDelete();
            $table->string('precision', 40)->nullable(); // argot, quartier d'origine ; null : au choix (Instrument, Science)
            $table->boolean('de_role')->default(false); // l'une des 7 compétences du rôle (sinon : compétence de base)
            $table->unsignedTinyInteger('niveau_rat_des_rues');
            $table->unique(['role_id', 'competence_id']);
        });

        Schema::create('cpr_role_profil', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('cpr_role')->cascadeOnDelete();
            $table->unsignedTinyInteger('jet'); // 1 à 10
            foreach (self::CARACS as $carac) {
                $table->unsignedTinyInteger($carac);
            }
            $table->unique(['role_id', 'jet']);
        });

        app(CprReferenceCatalogue::class)->synchroniser(['cpr_role', 'cpr_competence', 'cpr_role_competence', 'cpr_role_profil']);
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_role_profil');
        Schema::dropIfExists('cpr_role_competence');
        Schema::dropIfExists('cpr_competence');
        Schema::dropIfExists('cpr_role');
        app(CprReferenceCatalogue::class)->oublierLeCache(['cpr_role', 'cpr_competence', 'cpr_role_competence', 'cpr_role_profil']);
    }
};
