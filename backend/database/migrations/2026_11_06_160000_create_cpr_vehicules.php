<?php

use App\Http\Services\Cpr\CprReferenceCatalogue;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (7/8) : les véhicules (livre p. 189-191) et les améliorations de véhicule du Nomade (p. 161-165),
 * d'après doc/cyberpunk/rules/04-combat.md et 03-capacites-de-role.md. `rang_nomade` : le rang de Moto à partir duquel le véhicule entre
 * dans le garage familial. Lignes du livre : `user_id` null.
 * Les lignes viennent de database/data/cpr/<table>.php, avec leur id fixe (CprReferenceCatalogue, commande cpr:reference).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cpr_vehicule', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('code', 40)->nullable()->unique();
            $table->string('nom', 60);
            $table->string('milieu', 10); // terrestre, maritime, aerien
            $table->string('genre', 20); // moto, voiture, jet_ski, bateau, bateau_de_plaisance, yacht, gyrocoptere, helicoptere, aerodyne, aerozep
            $table->unsignedTinyInteger('pds');
            $table->unsignedTinyInteger('places'); // par pièce si `pieces_minimum`
            $table->unsignedTinyInteger('mouv');
            $table->unsignedSmallInteger('vitesse_kmh');
            $table->unsignedInteger('prix'); // par pièce si `pieces_minimum`
            $table->unsignedTinyInteger('pieces_minimum')->nullable();
            $table->unsignedTinyInteger('rang_nomade')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        Schema::create('cpr_amelioration_vehicule', function (Blueprint $table) {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('nom', 80);
            $table->unsignedTinyInteger('rang_requis');
            $table->string('vehicules', 40);
            $table->boolean('cumulable')->default(false);
            $table->string('prerequis', 40)->nullable(); // code d'une autre amélioration
            $table->text('effet');
            $table->json('effets')->nullable();
            $table->unsignedTinyInteger('ordre')->default(0);
            $table->timestamps();
        });

        app(CprReferenceCatalogue::class)->synchroniser(['cpr_vehicule', 'cpr_amelioration_vehicule']);
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_amelioration_vehicule');
        Schema::dropIfExists('cpr_vehicule');
        app(CprReferenceCatalogue::class)->oublierLeCache(['cpr_vehicule', 'cpr_amelioration_vehicule']);
    }
};
