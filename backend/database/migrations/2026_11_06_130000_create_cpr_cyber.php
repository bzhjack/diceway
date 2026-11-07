<?php

use App\Http\Services\Cpr\CprReferenceCatalogue;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (4/8) : le catalogue du cybermatériel (livre p. 358-366, doc/cyberpunk/resources/cybermateriel.md ;
 * règles : doc/cyberpunk/rules/06-cybermateriel-et-humanite.md). Lignes du livre : `user_id` null.
 *
 * - `requiert` : les codes des pièces dont l'une doit être posée (le cyberœil pour ses options, le cyberbras ou la cyberjambe…).
 * - `emplacement` : le réservoir où l'implant prend place. Une pièce mère (`emplacements_fournis`) en ouvre un : neuromateriel (câblage
 *   neural, 5), cyberoeil (3 par œil), cyberaudio (kit, 3), cyberbras (4), cyberjambe (3), cybermembre (l'un ou l'autre),
 *   support_de_puces (1 puce par support). Cyberfashion, interne et externe n'ont pas de pièce mère : 7 emplacements chacun.
 *   « aucun » : rien d'occupé (pièces mères, revêtements, cyborgimplants).
 * - `bras_de_chair` : peut aussi se poser seul sur un bras (ou une jambe) de chair.
 * - `exclusif` : un seul implant de ce groupe à la fois (une mégadrénaline, un kit cyberaudio…).
 * - `ph_fixe` à la création, `ph_des` ensuite (1d6/2 arrondi au supérieur, 1d6, 2d6, 4d6).
 * - `effets` : ce que la fiche peut calculer (bonus de compétence, d'Initiative, de CARAC, PA, arme intégrée…) ; `effet` le décrit.
 * Les lignes viennent de database/data/cpr/<table>.php, avec leur id fixe (CprReferenceCatalogue, commande cpr:reference).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cpr_cyber', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 50)->nullable()->unique();
            $table->string('nom', 80);
            $table->string('categorie', 20); // cyberfashion, neuromateriel, cyberoptique, cyberaudio, interne, externe, cybermembre, cyborgimplant
            $table->string('installation', 20); // boutique, centre_medical, hopital, puce
            $table->json('requiert')->nullable();
            $table->string('emplacement', 20);
            $table->unsignedTinyInteger('emplacements_occupes')->default(1);
            $table->unsignedTinyInteger('emplacements_fournis')->default(0);
            $table->boolean('couple')->default(false); // se pose par paire (deux yeux, deux jambes), PH payée pour chacun
            $table->boolean('bras_de_chair')->default(false);
            $table->string('exclusif', 30)->nullable();
            $table->unsignedTinyInteger('ph_fixe')->default(0);
            $table->string('ph_des', 10)->nullable();
            $table->unsignedInteger('prix');
            $table->json('effets')->nullable();
            $table->json('prerequis')->nullable();
            $table->text('effet')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        app(CprReferenceCatalogue::class)->synchroniser(['cpr_cyber']);
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_cyber');
        app(CprReferenceCatalogue::class)->oublierLeCache(['cpr_cyber']);
    }
};
