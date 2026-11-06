<?php

namespace Tests\Feature;

use App\Models\Cpr\CprPersonnage;
use App\Models\Cpr\CprRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cyberpunk RED : les règles de création (étape 2.3 du plan), contrôlées en brouillon et à l'activation. */
class CprCreationReglesTest extends TestCase
{
    use RefreshDatabase;

    /** Une répartition valide de la capacité de chaque rôle au rang 4. */
    private const DETAILS = [
        'solo' => ['attaque_de_precision' => 3, 'reaction_d_initiative' => 1],
        'techie' => ['expert_terrain' => 2, 'expert_amelioration' => 2, 'expert_fabrication' => 2, 'expert_invention' => 2],
        'medtech' => ['chirurgie' => 2, 'medicaments' => 1, 'cryosystemes' => 1, 'medicaments_choisis' => ['rapidoc']],
        'nomade' => ['garage' => [['vehicule', 'moto_de_route'], ['vehicule', 'voiture_compacte'], ['amelioration', 'verre_pare_balles'], ['amelioration', 'cafay']]],
    ];

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
    }

    public function test_a_street_rat_of_every_role_can_be_activated(): void
    {
        foreach (CprRole::pluck('code') as $role) {
            $this->postJson('/api/cpr/personnages', $this->ratDesRues($role, statut: 'actif'))
                ->assertCreated()->assertJsonPath('statut', 'actif')->assertJsonPath('calcule.alertes', fn ($alertes) => true);
        }
        $this->assertSame(10, CprPersonnage::where('statut', 'actif')->count());
    }

    public function test_a_street_rat_keeps_his_stat_line_and_his_skills(): void
    {
        $fiche = $this->ratDesRues('solo');
        $fiche['int']++;
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['int']);

        $fiche = $this->ratDesRues('solo');
        $fiche['competences'][0]['niveau'] = 5;
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['competences']);
    }

    public function test_the_starting_kit_is_complete_at_activation_and_extras_fit_in_500_eddies(): void
    {
        $fiche = $this->ratDesRues('solo', statut: 'actif');
        array_shift($fiche['armes']);
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['dotation']);

        // En brouillon, la dotation peut être incomplète.
        $fiche['statut'] = 'brouillon';
        $this->postJson('/api/cpr/personnages', $fiche)->assertCreated();

        $fiche = $this->ratDesRues('solo');
        $fiche['objets'][] = ['objet_type' => 'equipement', 'objet_id' => $this->id('cpr_equipement', 'agent')];
        $this->postJson('/api/cpr/personnages', $fiche)->assertCreated();
        $fiche['objets'][] = ['objet_type' => 'equipement', 'objet_id' => $this->id('cpr_equipement', 'technoscanner')];
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['eddies']);
    }

    public function test_an_edgerunner_spends_86_points_on_the_skills_of_his_role(): void
    {
        $this->postJson('/api/cpr/personnages', $this->edgerunner('solo', statut: 'actif'))->assertCreated();
        $this->postJson('/api/cpr/personnages', $this->edgerunner('medtech', statut: 'actif'))->assertCreated();

        $fiche = $this->edgerunner('solo', statut: 'actif');
        $fiche['competences'][0]['niveau'] = 7;
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['competences']);

        // 80 points : un brouillon passe, une activation non.
        $fiche = $this->edgerunner('solo', points: 80);
        $this->postJson('/api/cpr/personnages', $fiche)->assertCreated();
        $fiche['statut'] = 'actif';
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['competences']);

        // Une compétence hors de son rôle.
        $fiche = $this->edgerunner('solo');
        $fiche['competences'][] = ['competence_id' => $this->id('cpr_competence', 'cybertech'), 'niveau' => 2];
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['competences']);
    }

    public function test_an_edgerunner_rolls_each_stat_in_the_column_of_his_role(): void
    {
        $fiche = $this->edgerunner('solo');
        $fiche['tech'] = 8; // la colonne TECH du Solo va de 3 à 5
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['tech']);
    }

    public function test_the_complete_package_buys_with_62_stat_points_86_skill_points_and_2550_eddies(): void
    {
        $this->postJson('/api/cpr/personnages', $this->formuleComplete(statut: 'actif'))->assertCreated();

        $fiche = $this->formuleComplete();
        $fiche['int'] = 9;
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['int']);

        $fiche = $this->formuleComplete();
        $fiche['ref']++;
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['caracs']);

        $fiche = $this->formuleComplete();
        $fiche['armures'][] = ['armure_id' => $this->id('cpr_armure', 'metalgear'), 'localisation' => 'corps'];
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['eddies']);
    }

    public function test_clothing_beyond_800_eddies_comes_out_of_the_main_budget(): void
    {
        $veste = DB::table('cpr_vetement')->where('style', 'haute_couture')->where('piece', 'veste')->value('id'); // 1 000 ED
        $fiche = $this->formuleComplete(); // 1 800 ED d'achats
        $fiche['objets'][] = ['objet_type' => 'vetement', 'objet_id' => $veste];
        $this->postJson('/api/cpr/personnages', $fiche)->assertCreated(); // 1 800 + (1 000 − 800) = 2 000

        $fiche['objets'][] = ['objet_type' => 'vetement', 'objet_id' => $veste];
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['eddies']); // 1 800 + 1 200
    }

    public function test_rules_common_to_every_method(): void
    {
        $fiche = $this->formuleComplete();
        $fiche['competences'][] = ['competence_id' => $this->id('cpr_competence', 'chirurgie'), 'niveau' => 2];
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['competences']);

        $fiche = $this->formuleComplete(statut: 'actif');
        $fiche['competences'] = array_values(array_filter($fiche['competences'], fn ($ligne) => ($ligne['precision'] ?? null) !== 'français'));
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['competences']);

        $fiche = $this->formuleComplete();
        $fiche['roles'][0]['rang'] = 5;
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['roles.0.rang']);
    }

    public function test_role_abilities_are_spread_by_the_rules(): void
    {
        $fiche = $this->ratDesRues('techie');
        $fiche['roles'][0]['details']['expert_terrain'] = 5;
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['roles.0.details']);

        $fiche = $this->ratDesRues('solo');
        $fiche['roles'][0]['details'] = ['attaque_de_precision' => 3, 'reaction_d_initiative' => 2];
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['roles.0.details']);

        $fiche = $this->ratDesRues('nomade');
        $fiche['roles'][0]['details']['garage'][0] = ['vehicule', 'supermoto']; // rang 7
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['roles.0.details']);

        $fiche = $this->ratDesRues('medtech', statut: 'actif');
        $fiche['roles'][0]['details']['medicaments_choisis'] = [];
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['roles.0.details']);
    }

    public function test_implants_cost_their_fixed_humanity_loss_at_creation(): void
    {
        $fiche = $this->ratDesRues('solo');
        $fiche['cyber'][1]['ph'] = 3;
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['cyber.1.ph']);

        $fiche = $this->ratDesRues('solo');
        $fiche['humanite'] = 50;
        $this->postJson('/api/cpr/personnages', $fiche)->assertStatus(422)->assertJsonValidationErrors(['humanite']);
    }

    public function test_an_active_sheet_and_a_npc_escape_the_creation_rules(): void
    {
        $id = $this->postJson('/api/cpr/personnages', $this->ratDesRues('solo', statut: 'actif'))->assertCreated()->json('id');
        $fiche = $this->ratDesRues('solo', statut: 'actif');
        $fiche['int'] = 10;
        $this->putJson("/api/cpr/personnages/{$id}", $fiche)->assertOk()->assertJsonPath('int', 10);

        $pnj = $this->ratDesRues('solo');
        $pnj['type'] = 'pnj';
        $pnj['int'] = 10;
        $this->postJson('/api/cpr/personnages', $pnj)->assertCreated();
    }

    public function test_medicine_and_field_expertise_reach_the_skills(): void
    {
        $medtech = $this->postJson('/api/cpr/personnages', $this->ratDesRues('medtech'))->assertCreated()->json('calcule.competences');
        $chirurgie = collect($medtech)->firstWhere('code', 'chirurgie');
        $this->assertSame(4, $chirurgie['niveau']); // 2 points de Chirurgie
        $this->assertSame(2, collect($medtech)->firstWhere('code', 'techniques_medicales')['niveau']);

        $techie = $this->postJson('/api/cpr/personnages', $this->ratDesRues('techie'))->assertCreated()->json('calcule.competences');
        $this->assertSame(2, collect($techie)->firstWhere('code', 'electronique')['bonus_de_role']);
    }

    // ----- Fiches d'essai, construites depuis les tables de référence -----

    /** Un Rat des Rues complet : ligne 6 de CARAC, compétences du rôle, première alternative de chaque dotation, Humanité de départ. */
    private function ratDesRues(string $code, string $statut = 'brouillon'): array
    {
        $role = CprRole::with(['competences.competence', 'profils', 'dotations'])->where('code', $code)->firstOrFail();
        $profil = $role->profils->firstWhere('jet', 6);
        $fiche = [
            'pseudo' => "Rat {$code}", 'methode' => 'rat_des_rues', 'statut' => $statut, 'role_id' => $role->id, 'profil_jet' => 6,
            'roles' => [['role_id' => $role->id, 'rang' => 4, 'details' => self::DETAILS[$code] ?? null]],
            'competences' => [...$role->competences->map(fn ($ligne) => [
                'competence_id' => $ligne->competence_id, 'niveau' => $ligne->niveau_rat_des_rues,
                'precision' => $ligne->precision ?? ($ligne->competence->specialite ? 'au choix' : null),
            ])->all(), $this->langueDOrigine()],
        ];
        foreach (CprPersonnage::CARACS as $carac) {
            $fiche[$carac] = $profil->$carac;
        }
        return [...$fiche, ...$this->dotation($role), 'humanite' => null];
    }

    /** Un Edgerunner : CARAC de la ligne 6 (donc dans chaque colonne), 20 compétences pour `$points` points, dotation du rôle. */
    private function edgerunner(string $code, string $statut = 'brouillon', int $points = 86): array
    {
        $fiche = $this->ratDesRues($code, $statut);
        $fiche['methode'] = 'edgerunner';
        unset($fiche['profil_jet']);
        $couts = DB::table('cpr_competence')->pluck('cout', 'id')->map(fn ($cout) => (int) $cout);
        $lignes = array_slice($fiche['competences'], 0, -1);
        foreach ($lignes as &$ligne) {
            $ligne['niveau'] = 4;
        }
        unset($ligne);
        $total = fn (array $lignes) => array_sum(array_map(fn ($ligne) => $ligne['niveau'] * $couts[$ligne['competence_id']], $lignes));
        for ($i = 0; $total($lignes) < $points && $i < 200; $i++) {
            $ligne = &$lignes[$i % count($lignes)];
            if ($couts[$ligne['competence_id']] === 1 && $ligne['niveau'] < 6) {
                $ligne['niveau']++;
            }
            unset($ligne);
        }
        for ($i = 0; $total($lignes) > $points && $i < 200; $i++) {
            $ligne = &$lignes[$i % count($lignes)];
            if ($couts[$ligne['competence_id']] === 1 && $ligne['niveau'] > 2) {
                $ligne['niveau']--;
            }
            unset($ligne);
        }
        $this->assertSame($points, $total($lignes));
        $fiche['competences'] = [...$lignes, $this->langueDOrigine()];
        return $fiche;
    }

    /** Une Formule complète : 62 points de CARAC, 86 de compétences, 1 800 ED d'achats et 150 ED de vêtements. */
    private function formuleComplete(string $statut = 'brouillon'): array
    {
        $solo = $this->id('cpr_role', 'solo');
        $competences = [];
        foreach (DB::table('cpr_competence')->where('de_base', true)->get() as $base) {
            $competences[] = ['competence_id' => $base->id, 'niveau' => 2, 'precision' => $base->precision_de_base];
        }
        // 13 × 2 = 26 ; + 60 : huit compétences à 6 (48) et Tir automatique (x2) à 6 (12).
        $achats = ['pistolet' => 6, 'armes_d_epaule' => 6, 'tir_automatique' => 6, 'tactique' => 6, 'interrogatoire' => 6,
            'arme_de_melee' => 6, 'resistance_a_la_torture_aux_drogues' => 6, 'conduite_de_vehicule_terrestre' => 6, 'pistage' => 6];
        foreach ($achats as $code => $niveau) {
            $competences[] = ['competence_id' => $this->id('cpr_competence', $code), 'niveau' => $niveau];
        }
        $this->assertSame(86, 26 + 6 * 8 + 6 * 2); // le tir automatique coûte double
        $competences[] = $this->langueDOrigine();
        $veste = DB::table('cpr_vetement')->where('style', 'generique')->where('piece', 'veste')->value('id');

        return [
            'pseudo' => 'Formule', 'methode' => 'formule_complete', 'statut' => $statut, 'role_id' => $solo,
            'int' => 7, 'ref' => 7, 'dex' => 6, 'tech' => 6, 'pres' => 6, 'vol' => 6, 'cha' => 6, 'mouv' => 6, 'cor' => 6, 'emp' => 6,
            'roles' => [['role_id' => $solo, 'rang' => 4, 'details' => self::DETAILS['solo']]],
            'competences' => $competences,
            'armes' => [['arme_id' => $this->id('cpr_arme', 'fusil_d_assaut')]],
            'armures' => [
                ['armure_id' => $this->id('cpr_armure', 'tenue_pare_balles_legere'), 'localisation' => 'corps'],
                ['armure_id' => $this->id('cpr_armure', 'tenue_pare_balles_legere'), 'localisation' => 'tete'],
            ],
            'cyber' => [
                ['cle' => 'c', 'cyber_id' => $this->id('cpr_cyber', 'cablage_neural'), 'ph' => 7],
                ['cle' => 's', 'cyber_id' => $this->id('cpr_cyber', 'sandevistan'), 'parent' => 'c', 'ph' => 7],
            ],
            'objets' => [
                ['objet_type' => 'equipement', 'objet_id' => $this->id('cpr_equipement', 'agent')],
                ['objet_type' => 'vetement', 'objet_id' => $veste, 'quantite' => 3],
            ],
        ];
    }

    private function langueDOrigine(): array
    {
        return ['competence_id' => $this->id('cpr_competence', 'langue'), 'precision' => 'français', 'niveau' => 4];
    }

    /** La première alternative de chaque groupe de dotation, sous la forme des lignes de la fiche ; PH fixes. */
    private function dotation(CprRole $role): array
    {
        $fiche = ['armes' => [], 'armures' => [], 'cyber' => [], 'objets' => []];
        $cyber = DB::table('cpr_cyber')->get()->keyBy('id');
        $parents = [];
        foreach ($role->dotations->where('objet_type', '!=', 'garage_familial')->groupBy('groupe') as $alternatives) {
            $dotation = $alternatives->first();
            match ($dotation->objet_type) {
                'arme' => $fiche['armes'][] = ['arme_id' => $dotation->objet_id],
                'armure' => $fiche['armures'][] = ['armure_id' => $dotation->objet_id, 'localisation' => $dotation->precision],
                'cyber' => $fiche['cyber'][] = ['cle' => (string) $dotation->objet_id, 'cyber_id' => $dotation->objet_id, 'ph' => $cyber[$dotation->objet_id]->ph_fixe],
                default => $fiche['objets'][] = ['objet_type' => $dotation->objet_type, 'objet_id' => $dotation->objet_id,
                    'quantite' => $dotation->quantite, 'precision' => $dotation->objet_type === 'munition' ? $dotation->precision : null],
            };
        }
        // Chaque implant se pose dans la pièce mère qu'il requiert, si la dotation la donne.
        $codes = collect($fiche['cyber'])->mapWithKeys(fn ($implant) => [$cyber[$implant['cyber_id']]->code => $implant['cle']]);
        foreach ($fiche['cyber'] as &$implant) {
            foreach (json_decode($cyber[$implant['cyber_id']]->requiert ?? '[]', true) ?? [] as $piece) {
                if (isset($codes[$piece])) {
                    $implant['parent'] = $codes[$piece];
                    break;
                }
            }
        }
        return $fiche;
    }

    private function id(string $table, string $code): int
    {
        return (int) DB::table($table)->where('code', $code)->value('id');
    }
}
