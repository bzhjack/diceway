<?php

use App\Http\Services\Cpr\CprReferenceCatalogue;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (5/8) : l'équipement général et les services, les vêtements (prix par style et par pièce), les
 * drogues de rue (livre p. 227-229, 351-357, 376 ; doc/cyberpunk/resources/equipement.md, doc/cyberpunk/rules/05-blessures-et-soins.md).
 * Lignes du livre : `user_id` null.
 * Les lignes viennent de database/data/cpr/<table>.php, avec leur id fixe (CprReferenceCatalogue, commande cpr:reference).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cpr_equipement', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 50)->nullable()->unique();
            $table->string('nom', 80);
            $table->string('type', 10); // objet, service
            $table->unsignedInteger('prix');
            $table->text('description')->nullable();
            $table->json('effets')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        Schema::create('cpr_vetement', function (Blueprint $table) {
            $table->id();
            $table->string('style', 30); // code du style
            $table->string('style_nom', 40);
            $table->string('exemples', 80);
            $table->string('piece', 30); // code de la pièce
            $table->string('piece_nom', 40);
            $table->unsignedInteger('prix');
            $table->unique(['style', 'piece']);
        });

        Schema::create('cpr_drogue', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 30)->nullable()->unique();
            $table->string('nom', 40);
            $table->unsignedInteger('prix'); // par dose
            $table->unsignedTinyInteger('duree_heures');
            $table->unsignedTinyInteger('sd_effet_secondaire');
            $table->text('effet_principal');
            $table->text('effet_secondaire');
            $table->json('effets')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        app(CprReferenceCatalogue::class)->synchroniser(['cpr_equipement', 'cpr_vetement', 'cpr_drogue']);
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_drogue');
        Schema::dropIfExists('cpr_vetement');
        Schema::dropIfExists('cpr_equipement');
        app(CprReferenceCatalogue::class)->oublierLeCache(['cpr_equipement', 'cpr_vetement', 'cpr_drogue']);
    }
};
