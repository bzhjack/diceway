<?php

use App\Http\Services\Cpr\CprReferenceCatalogue;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (3/8) : les armures et le bouclier balistique (livre p. 349-350, doc/cyberpunk/resources/armures.md).
 * Une armure s'achète pour la tête ou pour le corps, sauf la combinaison connectée qui couvre les deux. Lignes du livre : `user_id` null.
 * Les lignes viennent de database/data/cpr/<table>.php, avec leur id fixe (CprReferenceCatalogue, commande cpr:reference).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cpr_armure', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 40)->nullable()->unique();
            $table->string('nom', 60);
            $table->string('type', 10); // armure, bouclier
            $table->unsignedTinyInteger('pa')->nullable(); // armure
            $table->unsignedTinyInteger('ps')->nullable(); // bouclier
            $table->unsignedTinyInteger('penalite')->default(0); // retirée à RÉF, DEX et MOUV
            $table->unsignedInteger('prix');
            $table->boolean('tete_et_corps')->default(false); // sinon : une pièce pour la tête ou pour le corps
            $table->unsignedTinyInteger('emplacements_materiel')->default(0); // emplacements de matériel ajoutés à la cyberconsole
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        app(CprReferenceCatalogue::class)->synchroniser(['cpr_armure']);
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_armure');
        app(CprReferenceCatalogue::class)->oublierLeCache(['cpr_armure']);
    }
};
