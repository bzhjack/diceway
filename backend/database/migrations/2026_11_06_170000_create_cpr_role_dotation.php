<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cyberpunk RED, données de référence (8/8) : l'équipement de départ de chaque rôle pour le Rat des Rues et l'Edgerunner (armes et armure
 * p. 98, attirail et vêtements p. 103, cyberimplants p. 117-118 ; doc/cyberpunk/resources/roles.md). En plus, chacun reçoit 500 ED.
 *
 * Une ligne par objet. Les lignes d'un même `groupe` sont des alternatives (« fusil à pompe ou fusil d'assaut ») ; un groupe d'une seule
 * ligne est imposé. `objet_type` dit dans quel catalogue chercher `objet_id`. Décisions du 2026-11-06 (doc/cyberpunk/plans) : le Solo garde
 * la liste du livre, sa « mégadrénaline » au choix est le Kerenzikov ; le Nomade reçoit 4 choix de garage familial de rang 4 au plus.
 */
return new class extends Migration
{
    /** Le cache des rôles porte leurs dotations. */
    private const CACHE = 'cpr_roles_all';

    /** Le catalogue de chaque type d'objet. */
    private const TABLES = [
        'arme' => 'cpr_arme',
        'armure' => 'cpr_armure',
        'munition' => 'cpr_munition',
        'equipement' => 'cpr_equipement',
        'cyber' => 'cpr_cyber',
        'programme' => 'cpr_programme',
    ];

    /**
     * Par rôle, la liste des groupes ; un groupe : ses alternatives (une seule : imposée). Objet : [type, code, quantité, précision].
     * Types : arme, armure (précision : corps ou tete), munition (code de la variété, précision : type de munition ; quantité en unités),
     * equipement, vetement (code « style.piece »), cyber, programme, garage_familial (Nomade : quantité = nombre de choix).
     */
    private const DOTATIONS = [
        'rockeur' => [
            [['arme', 'pistolet_tres_lourd', 1, null]],
            [['munition', 'standard', 50, 'pistolet_tl']],
            [['arme', 'melee_lourde', 1, null], ['munition', 'etourdissante', 1, 'grenade']],
            [['munition', 'lacrymogene', 2, 'grenade']],
            [['armure', 'tenue_pare_balles_legere', 1, 'corps']],
            [['armure', 'tenue_pare_balles_legere', 1, 'tete']],
            [['equipement', 'agent', 1, null]],
            [['equipement', 'ordinateur', 1, null]],
            [['equipement', 'instrument', 1, null], ['equipement', 'detecteur_de_micros', 1, null]],
            [['equipement', 'peinture_phosphorescente', 5, null]],
            [['equipement', 'amplificateur_portable', 1, null]],
            [['equipement', 'recepteur_radio', 1, null]],
            [['equipement', 'camera', 1, null]],
            [['vetement', 'generique.veste', 1, null]],
            [['vetement', 'generique.bijoux', 3, null]],
            [['vetement', 'generique.haut', 4, null]],
            [['vetement', 'urbain_flash.bas', 1, null]],
            [['vetement', 'urbain_flash.haut', 1, null]],
            [['vetement', 'decontracte.bijoux', 1, null]],
            [['vetement', 'decontracte.verres_miroirs', 1, null]],
            [['vetement', 'decontracte.chaussures', 1, null]],
            [['cyber', 'dermteinte', 1, null]],
            [['cyber', 'enregistreur_audio', 1, null]],
            [['cyber', 'kit_cyberaudio', 1, null]],
            [['cyber', 'tech_chev', 1, null]],
        ],
        'solo' => [
            [['arme', 'fusil_d_assaut', 1, null]],
            [['arme', 'pistolet_tres_lourd', 1, null]],
            [['arme', 'melee_lourde', 1, null], ['armure', 'bouclier_balistique', 1, null]],
            [['munition', 'standard', 30, 'pistolet_tl']],
            [['munition', 'standard', 70, 'fusil']],
            [['armure', 'tenue_pare_balles_legere', 1, 'corps']],
            [['armure', 'tenue_pare_balles_legere', 1, 'tete']],
            [['equipement', 'agent', 1, null]],
            [['vetement', 'decontracte.chaussures', 2, null]],
            [['vetement', 'decontracte.veste', 3, null]],
            [['vetement', 'decontracte.verres_miroirs', 1, null]],
            [['vetement', 'decontracte.bas', 2, null]],
            [['vetement', 'decontracte.haut', 2, null]],
            [['cyber', 'biomoniteur', 1, null]],
            [['cyber', 'cablage_neural', 1, null]],
            [['cyber', 'etripeurs', 1, null], ['cyber', 'kerenzikov', 1, null]],
            [['cyber', 'sandevistan', 1, null]],
        ],
        'netrunner' => [
            [['arme', 'pistolet_tres_lourd', 1, null]],
            [['munition', 'standard', 30, 'pistolet_tl']],
            [['armure', 'tenue_pare_balles_legere', 1, 'corps']],
            [['armure', 'tenue_pare_balles_legere', 1, 'tete']],
            [['equipement', 'agent', 1, null]],
            [['equipement', 'cyberconsole_standard', 1, null]],
            [['equipement', 'lunettes_de_realite_virtuelle', 1, null]],
            [['programme', 'armure', 1, null]],
            [['programme', 'sabre', 1, null]],
            [['programme', 'loupe', 1, null], ['programme', 'effaceur', 1, null]],
            [['programme', 'sabre', 1, null], ['programme', 'helice_d_eclairs', 1, null]],
            [['programme', 'ver', 1, null], ['programme', 'sabre', 1, null]],
            [['vetement', 'generique.haut', 10, null]],
            [['vetement', 'decontracte.chaussures', 2, null]],
            [['vetement', 'decontracte.bijoux', 1, null]],
            [['vetement', 'decontracte.bas', 2, null]],
            [['vetement', 'urbain_flash.veste', 1, null]],
            [['cyber', 'cablage_neural', 1, null]],
            [['cyber', 'lentilles_polychromes', 1, null]],
            [['cyber', 'port_d_interface_neuronale', 1, null]],
        ],
        'techie' => [
            [['arme', 'fusil_a_pompe', 1, null], ['arme', 'fusil_d_assaut', 1, null]],
            [['munition', 'standard', 100, 'chevrotine'], ['munition', 'standard', 100, 'fusil']],
            [['munition', 'etourdissante', 1, 'grenade']],
            [['armure', 'tenue_pare_balles_legere', 1, 'corps']],
            [['armure', 'tenue_pare_balles_legere', 1, 'tete']],
            [['equipement', 'agent', 1, null]],
            [['equipement', 'respirateur_antipollution', 1, null]],
            [['equipement', 'telephone_jetable', 1, null]],
            [['equipement', 'ruban_adhesif', 5, null]],
            [['equipement', 'lampe_torche', 1, null]],
            [['equipement', 'fusee_de_detresse', 6, null]],
            [['equipement', 'trousse_de_techie', 1, null]],
            [['vetement', 'generique.bas', 8, null]],
            [['vetement', 'generique.haut', 10, null]],
            [['vetement', 'decontracte.chaussures', 2, null]],
            [['cyber', 'cyberoeil', 1, null]],
            [['cyber', 'main_outil', 1, null]],
            [['cyber', 'micro_optique', 1, null]],
            [['cyber', 'montre_dermique', 1, null]],
        ],
        'medtech' => [
            [['arme', 'fusil_a_pompe', 1, null], ['arme', 'fusil_d_assaut', 1, null]],
            [['munition', 'standard', 100, 'chevrotine'], ['munition', 'standard', 100, 'fusil']],
            [['munition', 'incendiaire', 10, 'chevrotine'], ['munition', 'incendiaire', 10, 'fusil']],
            [['munition', 'fumigene', 2, 'grenade']],
            [['armure', 'tenue_pare_balles_legere', 1, 'corps']],
            [['armure', 'tenue_pare_balles_legere', 1, 'tete']],
            [['armure', 'bouclier_balistique', 1, null]],
            [['equipement', 'agent', 1, null]],
            [['equipement', 'hypodair', 1, null]],
            [['equipement', 'menottes', 1, null]],
            [['equipement', 'lampe_torche', 1, null]],
            [['equipement', 'peinture_phosphorescente', 1, null]],
            [['equipement', 'sacoche_de_medtech', 1, null]],
            [['vetement', 'generique.veste', 3, null]],
            [['vetement', 'decontracte.chaussures', 1, null]],
            [['vetement', 'decontracte.bas', 3, null]],
            [['vetement', 'decontracte.haut', 5, null]],
            [['cyber', 'biomoniteur', 1, null]],
            [['cyber', 'cyberoeil', 1, null]],
            [['cyber', 'capteurs_de_toxines', 1, null], ['cyber', 'filtres_nasaux', 1, null]],
            [['cyber', 'teleoptique', 1, null]],
        ],
        'media' => [
            [['arme', 'pistolet_lourd', 1, null], ['arme', 'pistolet_tres_lourd', 1, null]],
            [['munition', 'standard', 50, 'pistolet_l'], ['munition', 'standard', 50, 'pistolet_tl']],
            [['armure', 'tenue_pare_balles_legere', 1, 'corps']],
            [['armure', 'tenue_pare_balles_legere', 1, 'tete']],
            [['equipement', 'agent', 1, null]],
            [['equipement', 'enregistreur_audio', 1, null]],
            [['equipement', 'jumelles', 1, null]],
            [['equipement', 'telephone_jetable', 2, null], ['equipement', 'lance_grappin', 1, null]],
            [['equipement', 'lampe_torche', 1, null]],
            [['equipement', 'ordinateur', 1, null]],
            [['equipement', 'recepteur_radio', 1, null]],
            [['equipement', 'brouilleur_decrypteur', 1, null]],
            [['equipement', 'camera', 1, null]],
            [['vetement', 'generique.chaussures', 1, null]],
            [['vetement', 'generique.haut', 1, null]],
            [['vetement', 'generique.bas', 1, null]],
            [['vetement', 'decontracte.veste', 1, null]],
            [['vetement', 'urbain_flash.verres_miroirs', 1, null]],
            [['cyber', 'amplificateur_audio', 1, null], ['cyber', 'analyseur_de_stress_vocal', 1, null]],
            [['cyber', 'kit_cyberaudio', 1, null]],
            [['cyber', 'tatouage_lumineux', 1, null]],
        ],
        'justicier' => [
            [['arme', 'fusil_d_assaut', 1, null], ['arme', 'fusil_a_pompe', 1, null]],
            [['arme', 'pistolet_lourd', 1, null]],
            [['munition', 'standard', 100, 'fusil'], ['munition', 'standard', 100, 'chevrotine'], ['munition', 'standard', 100, 'slug']],
            [['munition', 'standard', 30, 'pistolet_l']],
            [['armure', 'bouclier_balistique', 1, null], ['munition', 'fumigene', 2, 'grenade']],
            [['armure', 'tenue_pare_balles_legere', 1, 'corps']],
            [['armure', 'tenue_pare_balles_legere', 1, 'tete']],
            [['equipement', 'agent', 1, null]],
            [['equipement', 'lampe_torche', 1, null]],
            [['equipement', 'menottes', 2, null]],
            [['equipement', 'communicateur_radio', 1, null]],
            [['equipement', 'fusee_de_detresse', 10, null]],
            [['vetement', 'generique.veste', 1, null]],
            [['vetement', 'generique.bas', 2, null]],
            [['vetement', 'generique.haut', 3, null]],
            [['vetement', 'decontracte.chaussures', 2, null]],
            [['vetement', 'decontracte.veste', 2, null]],
            [['vetement', 'decontracte.bas', 2, null]],
            [['vetement', 'decontracte.verres_miroirs', 1, null]],
            [['vetement', 'decontracte.haut', 2, null]],
            [['cyber', 'holster_cache', 1, null]],
            [['cyber', 'poche_subdermique', 1, null]],
        ],
        'corporatiste' => [
            [['arme', 'pistolet_tres_lourd', 1, null]],
            [['munition', 'standard', 50, 'pistolet_tl']],
            [['armure', 'tenue_pare_balles_legere', 1, 'corps']],
            [['armure', 'tenue_pare_balles_legere', 1, 'tete']],
            [['equipement', 'communicateur_radio', 4, null]],
            [['equipement', 'brouilleur_decrypteur', 1, null]],
            [['vetement', 'cadre_sup.chaussures', 1, null]],
            [['vetement', 'cadre_sup.veste', 1, null]],
            [['vetement', 'cadre_sup.bas', 1, null]],
            [['vetement', 'cadre_sup.verres_miroirs', 1, null]],
            [['vetement', 'cadre_sup.haut', 1, null]],
            [['vetement', 'cadre_sup.bijoux', 2, null]],
            [['cyber', 'agent_interne', 1, null]],
            [['cyber', 'biomoniteur', 1, null], ['cyber', 'tech_chev', 1, null]],
            [['cyber', 'kit_cyberaudio', 1, null]],
            [['cyber', 'capteurs_de_toxines', 1, null], ['cyber', 'filtres_nasaux', 1, null]],
        ],
        'fixer' => [
            [['arme', 'pistolet_lourd', 1, null], ['arme', 'pistolet_tres_lourd', 1, null]],
            [['arme', 'pistolet_lourd', 1, null], ['arme', 'pistolet_tres_lourd', 1, null]],
            [['arme', 'melee_legere', 1, null]],
            [['munition', 'standard', 100, 'pistolet_l'], ['munition', 'standard', 100, 'pistolet_tl']],
            [['armure', 'tenue_pare_balles_legere', 1, 'corps']],
            [['armure', 'tenue_pare_balles_legere', 1, 'tete']],
            [['equipement', 'agent', 1, null]],
            [['equipement', 'detecteur_de_micros', 1, null]],
            [['equipement', 'ordinateur', 1, null]],
            [['equipement', 'telephone_jetable', 2, null]],
            [['vetement', 'generique.lentilles_de_contact', 1, null]],
            [['vetement', 'generique.bijoux', 1, null]],
            [['vetement', 'decontracte.verres_miroirs', 1, null]],
            [['vetement', 'urbain_flash.chaussures', 1, null]],
            [['vetement', 'urbain_flash.veste', 1, null]],
            [['vetement', 'urbain_flash.bas', 1, null]],
            [['vetement', 'urbain_flash.haut', 1, null]],
            [['cyber', 'agent_interne', 1, null]],
            [['cyber', 'analyseur_de_stress_vocal', 1, null], ['cyber', 'amplificateur_audio', 1, null]],
            [['cyber', 'kit_cyberaudio', 1, null]],
            [['cyber', 'poche_subdermique', 1, null]],
        ],
        'nomade' => [
            [['arme', 'pistolet_lourd', 1, null], ['arme', 'pistolet_tres_lourd', 1, null]],
            [['munition', 'standard', 100, 'pistolet_l'], ['munition', 'standard', 100, 'pistolet_tl']],
            [['arme', 'melee_lourde', 1, null], ['arme', 'pistolet_lourd', 1, null]],
            [['armure', 'tenue_pare_balles_legere', 1, 'corps']],
            [['armure', 'tenue_pare_balles_legere', 1, 'tete']],
            [['equipement', 'agent', 1, null]],
            [['equipement', 'respirateur_antipollution', 1, null]],
            [['equipement', 'ruban_adhesif', 1, null]],
            [['equipement', 'lampe_torche', 1, null]],
            [['equipement', 'lance_grappin', 1, null]],
            [['equipement', 'matelas_et_sac_de_couchage', 1, null]],
            [['equipement', 'sacoche_de_medtech', 1, null]],
            [['equipement', 'communicateur_radio', 2, null]],
            [['equipement', 'corde', 1, null]],
            [['equipement', 'technioutil', 1, null]],
            [['equipement', 'tente_et_bivouac', 1, null]],
            [['vetement', 'boheme.bijoux', 1, null]],
            [['vetement', 'ame_nomade.haut', 4, null]],
            [['vetement', 'ame_nomade.bas', 2, null]],
            [['vetement', 'ame_nomade.chaussures', 2, null]],
            [['vetement', 'ame_nomade.veste', 1, null]],
            [['vetement', 'ame_nomade.couvre_chef', 1, null]],
            [['cyber', 'cablage_neural', 1, null]],
            [['cyber', 'etripeurs', 1, null], ['cyber', 'port_d_interface_neuronale', 1, null]],
            [['garage_familial', 'rang_4', 4, '4 choix : véhicules ou améliorations de rang 4 au plus']],
        ],
    ];

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

        $roles = DB::table('cpr_role')->pluck('id', 'code');
        $lignes = [];
        foreach (self::DOTATIONS as $role => $groupes) {
            $ordre = 0;
            foreach ($groupes as $index => $alternatives) {
                foreach ($alternatives as [$type, $code, $quantite, $precision]) {
                    $lignes[] = [
                        'role_id' => $roles[$role], 'groupe' => $index + 1, 'objet_type' => $type, 'objet_id' => $this->objet($type, $code),
                        'quantite' => $quantite, 'precision' => $precision, 'ordre' => ++$ordre,
                    ];
                }
            }
        }
        DB::table('cpr_role_dotation')->insert($lignes);
        Cache::forget(self::CACHE);
    }

    /** L'identifiant de l'objet dans son catalogue ; une dotation qui cite un objet absent arrête la migration. */
    private function objet(string $type, string $code): ?int
    {
        if ($type === 'garage_familial') {
            return null;
        }
        if ($type === 'vetement') {
            [$style, $piece] = explode('.', $code);
            $id = DB::table('cpr_vetement')->where('style', $style)->where('piece', $piece)->value('id');
        } else {
            $id = DB::table(self::TABLES[$type])->whereNull('user_id')->where('code', $code)->value('id');
        }
        if ($id === null) {
            throw new RuntimeException("Dotation : {$type} « {$code} » introuvable dans le catalogue.");
        }
        return (int) $id;
    }

    public function down(): void
    {
        Schema::dropIfExists('cpr_role_dotation');
        Cache::forget(self::CACHE);
    }
};
