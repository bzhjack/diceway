<?php

use App\Http\Services\Cpr\CprReferenceCatalogue;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (8/8) : l'équipement de départ de chaque rôle pour le Rat des Rues et l'Edgerunner (armes et armure
 * p. 98, attirail et vêtements p. 103, cyberimplants p. 117-118 ; doc/cyberpunk/resources/roles.md). En plus, chacun reçoit 500 ED.
 *
 * Une ligne par objet. Les lignes d'un même `groupe` sont des alternatives (« fusil à pompe ou fusil d'assaut ») ; un groupe d'une seule
 * ligne est imposé. `objet_type` dit dans quel catalogue chercher `objet_id`. Décisions du 2026-11-06 (doc/cyberpunk/plans) : le Solo garde
 * la liste du livre, sa « mégadrénaline » au choix est le Kerenzikov ; le Nomade reçoit 4 choix de garage familial de rang 4 au plus.
 * Les lignes viennent de database/data/cpr/<table>.php, avec leur id fixe (CprReferenceCatalogue, commande cpr:reference).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cpr_role_dotation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('cpr_role')->cascadeOnDelete();
            $table->unsignedTinyInteger('groupe'); // les lignes d'un même groupe sont des alternatives
            $table->string('objet_type', 20); // arme, armure, munition, equipement, vetement, cyber, programme, garage_familial
            $table->unsignedBigInteger('objet_id')->nullable(); // null : garage familial
            $table->unsignedSmallInteger('quantite')->default(1);
            $table->string('precision', 80)->nullable(); // armure : corps ou tete ; munition : type (pistolet_tl, grenade…)
            $table->unsignedSmallInteger('ordre');
            $table->index(['role_id', 'groupe']);
        });

        app(CprReferenceCatalogue::class)->synchroniser(['cpr_role_dotation']);
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_role_dotation');
        app(CprReferenceCatalogue::class)->oublierLeCache(['cpr_role_dotation']);
    }
};
