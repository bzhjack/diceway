<?php

use App\Http\Services\Cpr\CprReferenceCatalogue;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (6/8) : programmes, GLACE et Démons, matériel de cyberconsole (livre p. 202-218,
 * doc/cyberpunk/rules/07-netrunning.md). Les défenses (drones, tourelles, pièges) viendront avec les architectures. Lignes du livre :
 * `user_id` null.
 * Les lignes viennent de database/data/cpr/<table>.php, avec leur id fixe (CprReferenceCatalogue, commande cpr:reference).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cpr_programme', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 40)->nullable()->unique();
            $table->string('nom', 60);
            $table->string('classe', 12); // soutien, defensif, offensif, glace, demon
            $table->string('cible', 15)->nullable(); // antiprogramme, antipersonnel
            $table->unsignedTinyInteger('att')->nullable();
            $table->unsignedTinyInteger('def')->nullable();
            $table->unsignedTinyInteger('rez')->nullable();
            $table->unsignedTinyInteger('per')->nullable(); // GLACE : SD de Glissement
            $table->unsignedTinyInteger('vit')->nullable(); // GLACE
            $table->unsignedTinyInteger('interface')->nullable(); // Démon
            $table->unsignedTinyInteger('actions_virtuelles')->nullable(); // Démon
            $table->unsignedTinyInteger('valeur_combat')->nullable(); // Démon
            $table->unsignedTinyInteger('emplacements')->nullable(); // dans une cyberconsole ; null : ne s'y installe pas (Démon)
            $table->unsignedInteger('prix');
            $table->text('effet')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        Schema::create('cpr_materiel_net', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 40)->nullable()->unique();
            $table->string('nom', 60);
            $table->unsignedTinyInteger('emplacements');
            $table->unsignedInteger('prix');
            $table->text('effet');
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        app(CprReferenceCatalogue::class)->synchroniser(['cpr_programme', 'cpr_materiel_net']);
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_materiel_net');
        Schema::dropIfExists('cpr_programme');
        app(CprReferenceCatalogue::class)->oublierLeCache(['cpr_programme', 'cpr_materiel_net']);
    }
};
