<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (2/8) : les classes d'armes et les armes exotiques, les munitions, les accessoires d'armes
 * (livre p. 340-349, doc/cyberpunk/resources/armes.md). Lignes du livre : `user_id` null ; un compte pourra y ajouter ses propres objets.
 *
 * Une arme exotique est une variante d'une classe (`base`) : ce qu'elle ne précise pas, elle le tient de sa classe.
 */
return new class extends Migration
{
    private const CACHE = ['cpr_armes_catalogue', 'cpr_munitions_catalogue', 'cpr_accessoires_catalogue'];

    /** Types de munitions, du plus petit au plus gros. */
    private const BALLES = ['pistolet_m', 'pistolet_l', 'pistolet_tl', 'fusil'];
    private const TOUTES = ['pistolet_m', 'pistolet_l', 'pistolet_tl', 'slug', 'fusil', 'chevrotine', 'fleche', 'grenade', 'roquette'];

    /**
     * Classes d'armes. Clés : code, nom, categorie, competence (code), degats, chargeur, munition, att_round, mains (null : selon le
     * modèle), dissimulable, prix, traits, chargeur_extension, chargeur_cylindre.
     */
    private const CLASSES = [
        ['code' => 'melee_legere', 'nom' => 'Arme de mêlée légère', 'categorie' => 'melee', 'competence' => 'arme_de_melee', 'degats' => '1d6',
            'att_round' => 2, 'dissimulable' => true, 'prix' => 50, 'notes' => 'Couteau de combat, tomahawk.'],
        ['code' => 'melee_intermediaire', 'nom' => 'Arme de mêlée intermédiaire', 'categorie' => 'melee', 'competence' => 'arme_de_melee',
            'degats' => '2d6', 'att_round' => 2, 'dissimulable' => false, 'prix' => 50, 'notes' => 'Batte de baseball, pied-de-biche, machette.'],
        ['code' => 'melee_lourde', 'nom' => 'Arme de mêlée lourde', 'categorie' => 'melee', 'competence' => 'arme_de_melee', 'degats' => '3d6',
            'att_round' => 2, 'dissimulable' => false, 'prix' => 100, 'notes' => 'Tuyau en plomb, épée, batte cloutée.'],
        ['code' => 'melee_tres_lourde', 'nom' => 'Arme de mêlée très lourde', 'categorie' => 'melee', 'competence' => 'arme_de_melee',
            'degats' => '4d6', 'att_round' => 1, 'dissimulable' => false, 'prix' => 500, 'notes' => 'Tronçonneuse, pioche, pale d’hélicoptère, naginata.'],

        ['code' => 'pistolet_moyen', 'nom' => 'Pistolet moyen', 'categorie' => 'distance', 'competence' => 'pistolet', 'degats' => '2d6',
            'chargeur' => 12, 'munition' => 'pistolet_m', 'att_round' => 2, 'mains' => 1, 'dissimulable' => true, 'prix' => 50,
            'chargeur_extension' => 18, 'chargeur_cylindre' => 36],
        ['code' => 'pistolet_lourd', 'nom' => 'Pistolet lourd', 'categorie' => 'distance', 'competence' => 'pistolet', 'degats' => '3d6',
            'chargeur' => 8, 'munition' => 'pistolet_l', 'att_round' => 2, 'mains' => 1, 'dissimulable' => true, 'prix' => 100,
            'chargeur_extension' => 14, 'chargeur_cylindre' => 28],
        ['code' => 'pistolet_tres_lourd', 'nom' => 'Pistolet très lourd', 'categorie' => 'distance', 'competence' => 'pistolet', 'degats' => '4d6',
            'chargeur' => 8, 'munition' => 'pistolet_tl', 'att_round' => 1, 'mains' => 1, 'dissimulable' => false, 'prix' => 100,
            'chargeur_extension' => 14, 'chargeur_cylindre' => 28],
        ['code' => 'pistolet_mitrailleur', 'nom' => 'Pistolet-mitrailleur', 'categorie' => 'distance', 'competence' => 'pistolet', 'degats' => '2d6',
            'chargeur' => 30, 'munition' => 'pistolet_m', 'att_round' => 1, 'mains' => 1, 'dissimulable' => true, 'prix' => 100,
            'traits' => ['tir_automatique' => 3, 'tir_de_suppression' => true], 'chargeur_extension' => 40, 'chargeur_cylindre' => 50],
        ['code' => 'pistolet_mitrailleur_lourd', 'nom' => 'Pistolet-mitrailleur lourd', 'categorie' => 'distance', 'competence' => 'pistolet',
            'degats' => '3d6', 'chargeur' => 40, 'munition' => 'pistolet_l', 'att_round' => 1, 'mains' => 1, 'dissimulable' => false, 'prix' => 100,
            'traits' => ['tir_automatique' => 3, 'tir_de_suppression' => true], 'chargeur_extension' => 50, 'chargeur_cylindre' => 60],
        ['code' => 'fusil_a_pompe', 'nom' => 'Fusil à pompe', 'categorie' => 'distance', 'competence' => 'armes_d_epaule', 'degats' => '5d6',
            'chargeur' => 4, 'munition' => 'slug', 'att_round' => 1, 'mains' => 2, 'dissimulable' => false, 'prix' => 500,
            'traits' => ['chevrotine' => true], 'chargeur_extension' => 8, 'chargeur_cylindre' => 16],
        ['code' => 'fusil_d_assaut', 'nom' => 'Fusil d’assaut', 'categorie' => 'distance', 'competence' => 'armes_d_epaule', 'degats' => '5d6',
            'chargeur' => 25, 'munition' => 'fusil', 'att_round' => 1, 'mains' => 2, 'dissimulable' => false, 'prix' => 500,
            'traits' => ['tir_automatique' => 4, 'tir_de_suppression' => true], 'chargeur_extension' => 35, 'chargeur_cylindre' => 45],
        ['code' => 'fusil_de_precision', 'nom' => 'Fusil de précision', 'categorie' => 'distance', 'competence' => 'armes_d_epaule', 'degats' => '5d6',
            'chargeur' => 4, 'munition' => 'fusil', 'att_round' => 1, 'mains' => 2, 'dissimulable' => false, 'prix' => 500,
            'chargeur_extension' => 8, 'chargeur_cylindre' => 12],
        ['code' => 'arc_arbalete', 'nom' => 'Arcs et arbalètes', 'categorie' => 'distance', 'competence' => 'tir_a_l_arc', 'degats' => '4d6',
            'munition' => 'fleche', 'att_round' => 1, 'mains' => 2, 'dissimulable' => false, 'prix' => 100, 'traits' => ['fleches' => true]],
        ['code' => 'lance_grenades', 'nom' => 'Lance-grenades', 'categorie' => 'distance', 'competence' => 'armes_lourdes', 'degats' => '6d6',
            'chargeur' => 2, 'munition' => 'grenade', 'att_round' => 1, 'mains' => 2, 'dissimulable' => false, 'prix' => 500,
            'traits' => ['explosion' => true], 'chargeur_extension' => 4, 'chargeur_cylindre' => 6],
        ['code' => 'lance_roquettes', 'nom' => 'Lance-roquettes', 'categorie' => 'distance', 'competence' => 'armes_lourdes', 'degats' => '8d6',
            'chargeur' => 1, 'munition' => 'roquette', 'att_round' => 1, 'mains' => 2, 'dissimulable' => false, 'prix' => 500,
            'traits' => ['explosion' => true], 'chargeur_extension' => 2, 'chargeur_cylindre' => 3],
    ];

    /** Armes exotiques : `base` désigne la classe dont elles tiennent ce qu'elles ne précisent pas. `degats` null : pas de dégâts. */
    private const EXOTIQUES = [
        ['code' => 'malorian_3516', 'nom' => '3516 de Malorian Arms', 'base' => 'pistolet_tres_lourd', 'degats' => '5d6', 'qualite' => 'excellente',
            'prix' => 10000, 'traits' => ['liaison_smartgun' => true],
            'notes' => 'Liaison smartgun intégrée, à relier (ports d’interface neuronale ou poignée subdermique) pour s’en servir.'],
        ['code' => 'canon_a_ondes', 'nom' => 'Canon à ondes', 'base' => 'pistolet_tres_lourd', 'degats' => null, 'munition' => 'batterie',
            'prix' => 500, 'notes' => 'Pas de dégâts : Cybertech SD 15 ou deux appareils (au choix du MJ) hors service 1 minute. Batterie de 8 tirs, rechargée en 1 heure ; batterie supplémentaire 50 ED.'],
        ['code' => 'rhinemetall_emg_86', 'nom' => 'Canon électrique Rhinemetall EMG-86', 'base' => 'fusil_d_assaut', 'competence' => 'armes_lourdes',
            'chargeur' => 4, 'prix' => 5000, 'cor_minimum' => 11, 'ignore_armure_sous' => 11, 'traits' => [],
            'notes' => 'Ni visée ni tir automatique. Recharger prend deux actions. COR 11 requis sauf sur un support.'],
        ['code' => 'crache_feu', 'nom' => 'Crache-feu', 'base' => 'fusil_a_pompe', 'competence' => 'armes_lourdes', 'degats' => '3d6',
            'munition' => 'chevrotine', 'prix' => 500, 'traits' => ['incendiaire' => 4],
            'notes' => 'Ne tire que de la chevrotine incendiaire (au prix de la chevrotine incendiaire). Cibles en feu : 4 dégâts directs à chaque fin de tour jusqu’à une action pour s’éteindre. Ni blessure critique ni visée.'],
        ['code' => 'hurricane', 'nom' => 'Fusil d’assaut Hurricane de Constitution Arms', 'base' => 'fusil_a_pompe', 'chargeur' => 16,
            'att_round' => 2, 'prix' => 5000, 'cor_minimum' => 11,
            'notes' => 'Pas de visée. Chargeur cylindre de 16. Recharger prend deux actions. COR 11 requis sauf sur un support.'],
        ['code' => 'gantelet_de_combat', 'nom' => 'Gantelet de combat', 'categorie' => 'exotique', 'degats' => null, 'att_round' => null,
            'mains' => 1, 'dissimulable' => false, 'prix' => 1000, 'traits' => ['emplacements_cyberbras' => 3],
            'notes' => 'Trois emplacements d’options de cyberbras (même prix et même pose). Une action pour l’enfiler ou l’ôter.'],
        ['code' => 'tsunami_helix', 'nom' => 'Helix de Tsunami Arms', 'base' => 'fusil_d_assaut', 'competence' => 'tir_automatique', 'degats' => '2d6',
            'chargeur' => 40, 'prix' => 5000, 'cor_minimum' => 11, 'traits' => ['tir_automatique' => 5, 'balles_par_attaque' => 20],
            'notes' => 'Tir automatique seulement (20 balles par attaque), ni visée ni coup par coup. Recharger prend deux actions. COR 11 requis sauf sur un support.'],
        ['code' => 'hurleur', 'nom' => 'Hurleur', 'base' => 'pistolet_tres_lourd', 'degats' => null, 'munition' => 'batterie', 'prix' => 500,
            'notes' => 'Sans protection auditive, le tireur subit oreille endommagée. Pas de dégâts : Résistance à la torture/aux drogues SD 15 ou oreille endommagée. Batterie de 8 tirs.'],
        ['code' => 'kendachi_mono_trois', 'nom' => 'Kendachi Mono-trois', 'base' => 'melee_tres_lourde', 'mains' => 2, 'qualite' => 'excellente',
            'prix' => 5000, 'ignore_armure_sous' => 11,
            'notes' => 'N’ignore l’armure (PA inférieur à 11) qu’avec la bonne clé biométrique.'],
        ['code' => 'militech_cowboy_u56', 'nom' => 'Lance-grenades Militech « Cowboy » U-56', 'base' => 'lance_grenades', 'chargeur' => 4,
            'att_round' => 2, 'prix' => 5000, 'cor_minimum' => 11,
            'notes' => 'Tire n’importe quelle grenade. Recharger prend deux actions. COR 11 requis sauf sur un support.'],
        ['code' => 'matraque_electrique', 'nom' => 'Matraque électrique', 'base' => 'melee_intermediaire', 'mains' => 1, 'prix' => 100,
            'traits' => ['non_letal' => true],
            'notes' => 'Une cible qui tomberait sous 1 PS reste inconsciente à 1 PS. Ni blessure critique ni perforation.'],
        ['code' => 'pistolet_a_air_comprime', 'nom' => 'Pistolet à air comprimé', 'base' => 'pistolet_moyen', 'degats' => null, 'prix' => 100,
            'notes' => 'Billes de peinture sans dégâts. Remplies d’acide : −1 PA à la localisation touchée par tir réussi. Pas de blessure critique.'],
        ['code' => 'pistolet_a_flechettes', 'nom' => 'Pistolet à fléchettes', 'base' => 'pistolet_tres_lourd', 'munition' => 'fleche', 'prix' => 100,
            'notes' => 'Munitions de type flèche, chargeur de 8, se recharge comme un pistolet très lourd.'],
        ['code' => 'pistolet_a_impulsion', 'nom' => 'Pistolet à impulsion électrique', 'base' => 'pistolet_lourd', 'munition' => 'batterie', 'prix' => 100,
            'traits' => ['non_letal' => true],
            'notes' => 'Une cible qui tomberait sous 1 PS reste inconsciente à 1 PS. Ni blessure critique ni perforation. Batterie de 8 tirs.'],
    ];

    /** [code, nom, prix, types de munitions compatibles, effet]. Prix pour 10, sauf grenades et roquettes, à l'unité. */
    private const MUNITIONS = [
        ['standard', 'Standard', 10, 'sauf:grenade,roquette', 'Aucun effet particulier.'],
        ['biotoxine', 'Biotoxine', 500, 'fleche,grenade', 'Pas de dégâts : Résistance à la torture/aux drogues SD 15 ou 3d6 directs aux PS (armure non perforée).'],
        ['empoisonnee', 'Empoisonnée', 100, 'fleche,grenade', 'Pas de dégâts : Résistance à la torture/aux drogues SD 13 ou 2d6 directs aux PS (armure non perforée).'],
        ['caoutchouc', 'Caoutchouc', 10, 'fleche,balles,slug', 'Ni blessure critique ni perforation ; une cible à plus de 1 PS ne descend pas sous 1 PS.'],
        ['etourdissante', 'Étourdissante', 100, 'grenade', 'Pas de dégâts : Résistance SD 15 ou œil endommagé et oreille endommagée (sans dégâts bonus).'],
        ['expansive', 'Expansive', 100, 'fleche,balles,slug', 'Une « plaie avec corps étranger » fait tirer une seconde blessure critique d’un autre type (sans dégâts bonus).'],
        ['fumigene', 'Fumigène', 50, 'grenade', 'Pas de dégâts : fumée sur 10 × 10 m pendant 1 minute (−4 aux actions dedans).'],
        ['iem', 'IEM', 500, 'grenade', 'Pas de dégâts : Cybertech SD 15 ou deux appareils (au choix du MJ) hors service 1 minute.'],
        ['incendiaire', 'Incendiaire', 100, 'fleche,balles,slug,grenade,chevrotine', 'Si les dégâts traversent l’armure : en feu, 2 directs aux PS à chaque fin de tour jusqu’à une action pour s’éteindre (non cumulable).'],
        ['intelligente', 'Intelligente', 500, 'fleche,balles,slug,roquette', 'Demande une lunette de visée. Tir simple raté de 4 ou moins : second jet contre le même SD avec 1d10 + 10 (+ Chance). Esquivable.'],
        ['lacrymogene', 'Lacrymogène', 50, 'grenade', 'Pas de dégâts : Résistance SD 13 ou œil endommagé (sans dégâts bonus).'],
        ['perforante', 'Perforante', 100, 'sauf:chevrotine', 'Perfore l’armure de 2 au lieu de 1. Standard pour les grenades et les roquettes.'],
        ['soporifique', 'Soporifique', 500, 'fleche,grenade', 'Pas de dégâts : Résistance SD 13 ou au sol et inconscient 1 minute (réveillé par des dégâts ou une action).'],
    ];

    /** [code, nom, prix, emplacements, armes compatibles, dissimulable après pose, effet]. */
    private const ACCESSOIRES = [
        ['baionnette', 'Baïonnette', 100, 1, 'armes_d_epaule', false, 'Sert d’arme de mêlée légère.'],
        ['chargeur_cylindre', 'Chargeur à cylindre', 500, 1, 'distance_sauf_arcs', false, 'Capacité « cylindre » du chargeur. Un seul chargeur par arme.'],
        ['double_canon_a_pompe', 'Double canon à pompe', 500, 2, 'armes_d_epaule', false, 'À deux mains, sert aussi de fusil à pompe (2 cartouches).'],
        ['extension_de_chargeur', 'Extension de chargeur', 100, 1, 'distance_sauf_arcs', false, 'Capacité « extension » du chargeur. Un seul chargeur par arme.'],
        ['lance_grenades_sous_canon', 'Lance-grenades sous canon', 500, 2, 'armes_d_epaule', false, 'À deux mains, sert aussi de lance-grenades (1 grenade).'],
        ['liaison_smartgun', 'Liaison smartgun', 500, 2, 'distance', true, '+1 aux attaques à distance si l’on est relié (ports d’interface neuronale ou poignée subdermique, câblage neural requis). Pose en 1 heure.'],
        ['lunette_de_precision', 'Lunette de précision', 100, 1, 'distance', true, 'Détails jusqu’à 800 m ; +1 au tir simple ou visé sur une cible à 51 m ou plus (non cumulable avec la téléoptique).'],
        ['lunette_infrarouge', 'Lunette infrarouge de vision nocturne', 500, 1, 'distance', true, 'Annule le malus de tir dû à l’obscurité, la fumée, le brouillard.'],
    ];

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

        $this->remplir();
        $this->viderLeCache();
    }

    private function remplir(): void
    {
        $now = now();
        $competences = DB::table('cpr_competence')->pluck('id', 'code');
        $classes = [];
        $ordre = 0;
        foreach (self::CLASSES as $classe) {
            $ligne = $this->ligne($classe, $competences, ++$ordre, $now);
            $classes[$classe['code']] = ['id' => DB::table('cpr_arme')->insertGetId($ligne), ...$classe];
        }
        foreach (self::EXOTIQUES as $exotique) {
            $base = isset($exotique['base']) ? $classes[$exotique['base']] : [];
            $herite = array_diff_key($base, array_flip(['id', 'code', 'nom', 'categorie', 'notes', 'chargeur_extension', 'chargeur_cylindre']));
            $ligne = $this->ligne([...$herite, 'categorie' => 'exotique', ...$exotique], $competences, ++$ordre, $now);
            $ligne['base_id'] = $base['id'] ?? null;
            DB::table('cpr_arme')->insert($ligne);
        }

        foreach (self::MUNITIONS as $index => [$code, $nom, $prix, $types, $effet]) {
            DB::table('cpr_munition')->insert([
                'code' => $code, 'nom' => $nom, 'prix' => $prix, 'types' => json_encode($this->types($types)), 'effet' => $effet,
                'ordre' => $index + 1, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }

        foreach (self::ACCESSOIRES as $index => [$code, $nom, $prix, $emplacements, $compatibilite, $dissimulable, $effet]) {
            DB::table('cpr_accessoire')->insert([
                'code' => $code, 'nom' => $nom, 'prix' => $prix, 'emplacements' => $emplacements, 'compatibilite' => $compatibilite,
                'dissimulable' => $dissimulable, 'effet' => $effet, 'ordre' => $index + 1, 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }

    private function ligne(array $arme, $competences, int $ordre, $now): array
    {
        return [
            'code' => $arme['code'],
            'nom' => $arme['nom'],
            'categorie' => $arme['categorie'],
            'competence_id' => isset($arme['competence']) ? $competences[$arme['competence']] : null,
            'degats' => array_key_exists('degats', $arme) ? $arme['degats'] : null,
            'chargeur' => $arme['chargeur'] ?? null,
            'chargeur_extension' => $arme['chargeur_extension'] ?? null,
            'chargeur_cylindre' => $arme['chargeur_cylindre'] ?? null,
            'munition' => $arme['munition'] ?? null,
            'att_round' => array_key_exists('att_round', $arme) ? $arme['att_round'] : null,
            'mains' => $arme['mains'] ?? null,
            'dissimulable' => $arme['dissimulable'] ?? false,
            'qualite' => $arme['qualite'] ?? 'ordinaire',
            'prix' => $arme['prix'],
            'cor_minimum' => $arme['cor_minimum'] ?? null,
            'ignore_armure_sous' => $arme['ignore_armure_sous'] ?? null,
            'traits' => empty($arme['traits']) ? null : json_encode($arme['traits']),
            'notes' => $arme['notes'] ?? null,
            'ordre' => $ordre,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    /** « fleche,balles,slug » ou « sauf:grenade,roquette » → la liste des types. */
    private function types(string $liste): array
    {
        if (str_starts_with($liste, 'sauf:')) {
            return array_values(array_diff(self::TOUTES, explode(',', substr($liste, 5))));
        }
        $types = [];
        foreach (explode(',', $liste) as $type) {
            array_push($types, ...($type === 'balles' ? self::BALLES : [$type]));
        }
        return array_values(array_intersect(self::TOUTES, $types));
    }

    private function viderLeCache(): void
    {
        foreach (self::CACHE as $cle) {
            Cache::forget($cle);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_accessoire');
        Schema::dropIfExists('cpr_munition');
        Schema::dropIfExists('cpr_arme');
        $this->viderLeCache();
    }
};
