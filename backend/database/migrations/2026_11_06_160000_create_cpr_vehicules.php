<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (7/8) : les véhicules (livre p. 189-191) et les améliorations de véhicule du Nomade (p. 161-165),
 * d'après doc/cyberpunk/rules/04-combat.md et 03-capacites-de-role.md. `rang_nomade` : le rang de Moto à partir duquel le véhicule entre
 * dans le garage familial. Lignes du livre : `user_id` null.
 */
return new class extends Migration
{
    private const CACHE = ['cpr_vehicules_catalogue', 'cpr_ameliorations_vehicule_catalogue'];

    /**
     * [code, nom, milieu, genre, PDS, places, MOUV, vitesse (km/h), prix, rang Moto]. Places et prix « par pièce » pour le bateau de
     * plaisance, le yacht et l'aérozep (pièces minimum dans PIECES_MINIMUM).
     */
    private const VEHICULES = [
        ['moto_de_route', 'Moto de route', 'terrestre', 'moto', 35, 2, 20, 161, 20000, 1],
        ['supermoto', 'Supermoto', 'terrestre', 'moto', 35, 2, 60, 483, 100000, 7],
        ['voiture_compacte', 'Voiture terrestre compacte', 'terrestre', 'voiture', 50, 4, 20, 161, 30000, 1],
        ['voiture_haute_performance', 'Voiture terrestre à haute performance', 'terrestre', 'voiture', 50, 4, 40, 322, 50000, 5],
        ['supervoiture', 'Supervoiture terrestre', 'terrestre', 'voiture', 50, 2, 60, 483, 100000, 9],
        ['jet_ski', 'Jet ski', 'maritime', 'jet_ski', 35, 2, 20, 97, 20000, 1],
        ['hors_bord', 'Hors-bord', 'maritime', 'bateau', 50, 4, 20, 97, 30000, 5],
        ['bateau_de_plaisance', 'Bateau de plaisance', 'maritime', 'bateau_de_plaisance', 60, 2, 10, 24, 30000, 7],
        ['yacht', 'Yacht', 'maritime', 'yacht', 100, 4, 10, 24, 50000, 9],
        ['gyrocoptere', 'Gyrocoptère', 'aerien', 'gyrocoptere', 35, 2, 20, 161, 20000, 1],
        ['helicoptere', 'Hélicoptère', 'aerien', 'helicoptere', 60, 4, 40, 322, 40000, 5],
        ['av_4', 'Aérodyne polyvalent AV-4', 'aerien', 'aerodyne', 100, 6, 40, 322, 50000, 7],
        ['av_9', 'Superaérodyne AV-9', 'aerien', 'aerodyne', 60, 2, 60, 483, 100000, 9],
        ['aerozep', 'Aérozep', 'aerien', 'aerozep', 100, 2, 20, 161, 30000, 9],
    ];

    /** Les véhicules à pièces : places et prix par pièce, nombre minimum de pièces. */
    private const PIECES_MINIMUM = ['bateau_de_plaisance' => 2, 'yacht' => 4, 'aerozep' => 2];

    /**
     * [code, nom, rang de Moto requis, véhicules, cumulable, prérequis, effet, effets]. Véhicules : tous ; sauf_legers (ni moto, ni jet ski,
     * ni gyrocoptère) ; terrestres_maritimes ; terrestres ; terrestres_maritimes_sauf_moto_jet_ski ; motos ; voitures ; habitables (aérozep,
     * AV-4, bateau de plaisance, voitures terrestres, yacht).
     */
    private const AMELIORATIONS = [
        ['contrebande', 'Amélioration de contrebande', 1, 'tous', true, null, '2 holsters cachés (conducteur et 1 passager) et une grande cache ; trouvés sur Dissimulation/Révélation d’objet SD 17. Cumulable sauf moto, jet ski, gyrocoptère.', null],
        ['places_assises', 'Amélioration de places assises', 1, 'tous', true, null, '+2 places (side-car possible), sièges éjectables (10 m en l’air). Cumulable sauf moto, jet ski, gyrocoptère.', [['type' => 'places', 'valeur' => 2]]],
        ['securite', 'Amélioration de sécurité', 5, 'tous', false, null, 'Serrures biométriques (Sécurité électronique SD 17 ; échec : choc de matraque électrique) et camouflage optique à l’arrêt (Perception SD 17), 1 minute d’activation.', null],
        ['cafay', 'CAFAY', 1, 'tous', true, null, 'Une action pour une action de mouvement supplémentaire en conduisant ; une fois par jour par réservoir.', null],
        ['centre_de_communications', 'Centre de communications', 1, 'tous', false, null, 'Console avec Agent, 6 communicateurs radio, 6 brouilleurs, récepteur radio, traceur et 6 microtraceurs, enregistreur audio.', null],
        ['chassis_blinde', 'Châssis blindé', 5, 'tous', false, null, 'PA 13 (pas le verre).', [['type' => 'pa', 'valeur' => 13]]],
        ['crache_feu_integre', 'Crache-feu intégré', 1, 'tous', true, null, 'Le conducteur tire avec son action ; pas de recharge en conduisant.', null],
        ['mitrailleuse_integree', 'Mitrailleuse intégrée', 1, 'tous', true, null, 'Fusil d’assaut de 30 balles, tir automatique seulement, vers l’avant ; pas de recharge en conduisant.', null],
        ['verre_pare_balles', 'Verre pare-balles', 1, 'tous', true, null, 'Le verre devient un couvert de 15 PS ; une seconde fois, 30 PS. Chaque vitre séparément.', [['type' => 'verre', 'ps' => 15, 'ps_double' => 30]]],
        ['chassis_lourd', 'Châssis lourd', 1, 'sauf_legers', false, null, '+20 PDS, remorque 10 tonnes ; prérequis d’autres améliorations.', [['type' => 'pds', 'valeur' => 20]]],
        ['lance_roquettes_integre', 'Lance-roquettes intégré', 5, 'sauf_legers', true, 'chassis_lourd', '3 roquettes, vers l’avant.', null],
        ['support_d_arme_lourde', 'Support d’arme lourde', 5, 'sauf_legers', false, null, 'Un passager tire une arme à deux mains et recharge en mouvement ; la première fois, la famille offre l’arme (Helix, EMG-86 ou Cowboy U-56).', null],
        ['arme_de_melee_integree', 'Arme de mêlée intégrée', 1, 'terrestres_maritimes', true, null, 'Arme de mêlée très lourde, le conducteur attaque avec son action.', null],
        ['aeroglisseur', 'Amélioration d’aéroglisseur', 5, 'terrestres', false, null, 'Roule sur l’eau à la vitesse d’un bateau de plaisance.', null],
        ['moteur_d_av_4', 'Amélioration de moteur d’AV-4', 7, 'terrestres', false, null, 'Vole comme un AV-4 (Pilotage de véhicule aérien en l’air).', null],
        ['pare_chocs_de_combat', 'Pare-chocs de combat', 1, 'terrestres_maritimes_sauf_moto_jet_ski', false, null, 'En chargeant de l’avant, ni dégâts pour le véhicule ni coup du lapin pour les occupants ; avec CAFAY, +2d6 aux dégâts de charge.', null],
        ['integration_ports_interface', 'Intégration améliorée des ports d’interface neurale', 5, 'motos', false, null, 'Avec RÉF 8+ et conduite par ports d’interface, esquiver comme à pied pour soi, le passager et la moto.', null],
        ['herse_deployable', 'Herse déployable', 1, 'voitures', true, null, 'Le poursuivant fait Conduite de véhicule terrestre SD 17 ou subit 4d6 à son point faible ; herses de rechange 10 ED.', null],
        ['partie_habitable', 'Partie habitable', 1, 'habitables', false, null, 'Lit, toilettes, douche, cuisine (kombi) ; une pièce de plus sur les bateaux et l’aérozep. Châssis lourd requis sur voiture compacte ou haute performance.', null],
    ];

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

        $now = now();
        foreach (self::VEHICULES as $index => [$code, $nom, $milieu, $genre, $pds, $places, $mouv, $vitesse, $prix, $rang]) {
            DB::table('cpr_vehicule')->insert([
                'code' => $code, 'nom' => $nom, 'milieu' => $milieu, 'genre' => $genre, 'pds' => $pds, 'places' => $places, 'mouv' => $mouv,
                'vitesse_kmh' => $vitesse, 'prix' => $prix, 'pieces_minimum' => self::PIECES_MINIMUM[$code] ?? null, 'rang_nomade' => $rang,
                'ordre' => $index + 1, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
        foreach (self::AMELIORATIONS as $index => [$code, $nom, $rang, $vehicules, $cumulable, $prerequis, $effet, $effets]) {
            DB::table('cpr_amelioration_vehicule')->insert([
                'code' => $code, 'nom' => $nom, 'rang_requis' => $rang, 'vehicules' => $vehicules, 'cumulable' => $cumulable,
                'prerequis' => $prerequis, 'effet' => $effet, 'effets' => $effets === null ? null : json_encode($effets),
                'ordre' => $index + 1, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
        $this->viderLeCache();
    }

    private function viderLeCache(): void
    {
        foreach (self::CACHE as $cle) {
            Cache::forget($cle);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_amelioration_vehicule');
        Schema::dropIfExists('cpr_vehicule');
        $this->viderLeCache();
    }
};
