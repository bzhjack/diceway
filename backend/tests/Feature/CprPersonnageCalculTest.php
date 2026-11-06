<?php

namespace Tests\Feature;

use App\Http\Services\Cpr\CprPersonnageCalcul;
use App\Models\Cpr\CprPersonnage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cyberpunk RED : ce qui se calcule sur une fiche (étape 2.2 du plan), d'après les règles du livre. */
class CprPersonnageCalculTest extends TestCase
{
    use RefreshDatabase;

    public function test_hit_points_wound_threshold_and_death_save(): void
    {
        // L'exemple du livre (p. 79) : COR 7, VOL 6 → ⌈13/2⌉ = 7 → 45 PS, blessure grave sous 23, sauvegarde 7.
        $calcul = $this->calcul(['cor' => 7, 'vol' => 6]);

        $this->assertSame([45, 45, 23, 7], [$calcul['ps_max'], $calcul['ps'], $calcul['seuil_blessure_grave'], $calcul['sauvegarde_contre_la_mort']]);
        $this->assertSame(30, $this->calcul(['cor' => 4, 'vol' => 4, 'ps' => 12])['ps_max']);
        $this->assertSame(12, $this->calcul(['cor' => 4, 'vol' => 4, 'ps' => 12])['ps']);
    }

    public function test_humanity_follows_the_implants_and_empathy_follows_humanity(): void
    {
        $calcul = $this->calcul(['emp' => 5], cyber: [
            ['cle' => 'c', 'cyber' => 'cablage_neural', 'ph' => 7],
            ['cle' => 's', 'cyber' => 'sandevistan', 'parent' => 'c', 'ph' => 7],
            ['cle' => 'b', 'cyber' => 'biomoniteur', 'ph' => 0],
        ]);

        // Humanité de départ 50 − 14 ; maximum 50 − 2 par implant qui coûte de l'Humanité (le biomoniteur n'en coûte pas).
        $this->assertSame([14, 36, 46, 3], [$calcul['ph_totale'], $calcul['humanite'], $calcul['humanite_max'], $calcul['emp_actuelle']]);

        // L'exemple du livre (p. 80) : 44 d'Humanité, EMP 4.
        $this->assertSame(4, $this->calcul(['emp' => 5, 'humanite' => 44])['emp_actuelle']);
        $this->assertSame(3, $this->calcul(['emp' => 5, 'humanite' => 39])['emp_actuelle']);
    }

    public function test_a_cyborg_implant_lowers_maximum_humanity_by_four(): void
    {
        $calcul = $this->calcul(['emp' => 6, 'cor' => 8], cyber: [
            ['cle' => 'm1', 'cyber' => 'maillage_musculosquelettique', 'ph' => 14],
            ['cle' => 'm2', 'cyber' => 'maillage_musculosquelettique', 'ph' => 14],
            ['cle' => 'b', 'cyber' => 'charpente_lineaire_beta', 'ph' => 14],
        ]);

        $this->assertSame(60 - 2 - 2 - 4, $calcul['humanite_max']);
    }

    public function test_implants_raise_body_and_with_it_hit_points(): void
    {
        // Deux maillages : COR 6 + 4 = 10 (plafond du maillage) ; les PS suivent.
        $maillages = $this->calcul(['cor' => 6, 'vol' => 4], cyber: [
            ['cle' => 'm1', 'cyber' => 'maillage_musculosquelettique'],
            ['cle' => 'm2', 'cyber' => 'maillage_musculosquelettique'],
        ]);
        $this->assertSame([10, 45, 10], [$maillages['caracs']['cor'], $maillages['ps_max'], $maillages['sauvegarde_contre_la_mort']]);

        // Le plafond : COR 9 + 2 + 2 s'arrête à 10.
        $this->assertSame(10, $this->calcul(['cor' => 9], cyber: [
            ['cle' => 'm1', 'cyber' => 'maillage_musculosquelettique'],
            ['cle' => 'm2', 'cyber' => 'maillage_musculosquelettique'],
        ])['caracs']['cor']);

        // La charpente Σ fixe le COR à 12.
        $this->assertSame(12, $this->calcul(['cor' => 6], cyber: [
            ['cle' => 'm', 'cyber' => 'maillage_musculosquelettique'],
            ['cle' => 's', 'cyber' => 'charpente_lineaire_sigma'],
        ])['caracs']['cor']);
    }

    public function test_heavy_armor_slows_reflexes_dexterity_and_move(): void
    {
        $calcul = $this->calcul(['ref' => 8, 'dex' => 7, 'mouv' => 6], armures: [
            ['armure' => 'tenue_pare_balles_moyenne', 'localisation' => 'corps'],
            ['armure' => 'kevlar', 'localisation' => 'tete'],
        ]);

        $this->assertSame(2, $calcul['penalite_armure']);
        $this->assertSame([6, 5, 4], [$calcul['caracs_effectives']['ref'], $calcul['caracs_effectives']['dex'], $calcul['caracs_effectives']['mouv']]);
        $this->assertSame([8, 7, 6], [$calcul['caracs']['ref'], $calcul['caracs']['dex'], $calcul['caracs']['mouv']]);
        $this->assertSame(['tete' => 7, 'corps' => 12, 'boucliers' => []], $calcul['pa']);
    }

    public function test_stopping_power_is_the_best_source_of_each_location(): void
    {
        $calcul = $this->calcul(armures: [
            ['armure' => 'tenue_pare_balles_lourde', 'localisation' => 'corps', 'pa' => 10],
            ['armure' => 'bouclier_balistique'],
        ], cyber: [['cle' => 'a', 'cyber' => 'armure_subdermique']]);

        // Corps : la tenue perforée à 10 compte moins que l'armure subdermique (11). Tête : la subdermique seule.
        $this->assertSame(['tete' => 11, 'corps' => 11, 'boucliers' => [10]], $calcul['pa']);
        $this->assertSame(['tete' => 11, 'corps' => 11, 'boucliers' => []], $this->calcul(armures: [['armure' => 'combinaison_connectee']])['pa']);
        $this->assertSame(0, $this->calcul(armures: [['armure' => 'flak', 'localisation' => 'corps', 'equipee' => false]])['penalite_armure']);
    }

    public function test_skill_bases_add_stat_level_and_the_best_bonus(): void
    {
        $calcul = $this->calcul(['ref' => 8, 'int' => 6], competences: [
            ['competence' => 'pistolet', 'niveau' => 6],
            ['competence' => 'bibliotheque', 'niveau' => 2],
            ['competence' => 'perception', 'niveau' => 4],
        ], cyber: [
            ['cle' => 'k', 'cyber' => 'kit_cyberaudio'],
            ['cle' => 'a', 'cyber' => 'agent_interne', 'parent' => 'k'],
            ['cle' => 'amp', 'cyber' => 'amplificateur_audio', 'parent' => 'k'],
        ], objets: [['type' => 'equipement', 'code' => 'agent']]);

        $competences = collect($calcul['competences'])->keyBy('code');
        $this->assertSame(14, $competences['pistolet']['base']);
        // Agent et Agent interne donnent chacun +2 : ils ne se cumulent pas.
        $this->assertSame([2, 10], [$competences['bibliotheque']['bonus'], $competences['bibliotheque']['base']]);
        // L'amplificateur audio ne vaut que pour l'ouïe : listé, pas compté.
        $this->assertSame(10, $competences['perception']['base']);
        $this->assertSame('ouïe', $competences['perception']['bonus_sous_condition'][0]['condition']);
    }

    public function test_a_skill_chip_lifts_a_skill_to_level_three(): void
    {
        $calcul = $this->calcul(['tech' => 5], competences: [['competence' => 'armurerie', 'niveau' => 1]], cyber: [
            ['cle' => 'c', 'cyber' => 'cablage_neural'],
            ['cle' => 's', 'cyber' => 'support_de_puces', 'parent' => 'c'],
            ['cle' => 'p', 'cyber' => 'puce_de_competence', 'parent' => 's', 'precision' => 'armurerie'],
        ]);

        $this->assertSame([3, 8], [$calcul['competences'][0]['niveau'], $calcul['competences'][0]['base']]);
    }

    public function test_the_nomad_adds_his_moto_rank_to_driving(): void
    {
        $calcul = $this->calcul(['ref' => 7], competences: [['competence' => 'conduite_de_vehicule_terrestre', 'niveau' => 5]], roles: [['role' => 'nomade', 'rang' => 4]]);

        $this->assertSame([4, 16], [$calcul['competences'][0]['bonus_de_role'], $calcul['competences'][0]['base']]);
    }

    public function test_initiative_counts_permanent_bonuses_only(): void
    {
        $calcul = $this->calcul(['ref' => 8], cyber: [
            ['cle' => 'c', 'cyber' => 'cablage_neural'],
            ['cle' => 'k', 'cyber' => 'kerenzikov', 'parent' => 'c'],
        ], roles: [['role' => 'solo', 'rang' => 4, 'details' => ['reaction_d_initiative' => 1]]]);
        $this->assertSame(8 + 2 + 1, $calcul['initiative']);

        $sandevistan = $this->calcul(['ref' => 8], cyber: [
            ['cle' => 'c', 'cyber' => 'cablage_neural'],
            ['cle' => 's', 'cyber' => 'sandevistan', 'parent' => 'c'],
        ]);
        $this->assertSame(8, $sandevistan['initiative']);
    }

    public function test_slots_and_warnings(): void
    {
        $calcul = $this->calcul(cyber: [
            ['cle' => 'c', 'cyber' => 'cablage_neural'],
            ['cle' => 'k', 'cyber' => 'kerenzikov', 'parent' => 'c'],
            ['cle' => 's', 'cyber' => 'sandevistan', 'parent' => 'c'],
            ['cle' => 'o', 'cyber' => 'cyberoeil'],
            ['cle' => 'p', 'cyber' => 'pistolet_a_flechettes_oculaire', 'parent' => 'o'],
            ['cle' => 'm', 'cyber' => 'microcamera', 'parent' => 'o'],
            ['cle' => 't', 'cyber' => 'teleoptique'],
            ['cle' => 'b', 'cyber' => 'biomoniteur'],
        ]);

        $emplacements = collect($calcul['emplacements'])->keyBy('piece');
        $this->assertSame([5, 2, 3], [$emplacements['cablage_neural']['fournis'], $emplacements['cablage_neural']['occupes'], $emplacements['cablage_neural']['libres']]);
        $this->assertSame(-2, $emplacements['cyberoeil']['libres']);
        $this->assertSame([7, 1], [$emplacements['cyberfashion']['fournis'], $emplacements['cyberfashion']['occupes']]);

        $alertes = implode("\n", $calcul['alertes']);
        $this->assertStringContainsString('Trop d’implants dans « cyberoeil »', $alertes);
        $this->assertStringContainsString('Un seul implant « megadrenaline »', $alertes);
        $this->assertStringContainsString('« Téléoptique » n’est posé dans aucune pièce mère', $alertes);
        $this->assertSame([], $this->calcul(cyber: [['cle' => 'e', 'cyber' => 'etripeurs']])['alertes']);
    }

    public function test_the_sheet_comes_back_with_its_calculations(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $id = $this->postJson('/api/cpr/personnages', ['pseudo' => 'Kelsa', 'cor' => 7, 'vol' => 6])
            ->assertCreated()->assertJsonPath('calcule.ps_max', 45)->json('id');
        $this->getJson("/api/cpr/personnages/{$id}")->assertOk()->assertJsonPath('calcule.seuil_blessure_grave', 23);
    }

    /** Une fiche enregistrée, puis calculée. Les lignes citent les codes du catalogue. */
    private function calcul(array $caracs = [], array $cyber = [], array $armures = [], array $competences = [], array $objets = [], array $roles = []): array
    {
        $personnage = CprPersonnage::create(['pseudo' => 'Test', ...$caracs]);
        $personnage->roles()->createMany(array_map(fn ($role) => [
            'role_id' => $this->id('cpr_role', $role['role']), 'rang' => $role['rang'], 'details' => $role['details'] ?? null,
        ], $roles));
        $personnage->competences()->createMany(array_map(fn ($competence) => [
            'competence_id' => $this->id('cpr_competence', $competence['competence']), 'niveau' => $competence['niveau'],
        ], $competences));
        $personnage->armures()->createMany(array_map(fn ($armure) => [
            'armure_id' => $this->id('cpr_armure', $armure['armure']), 'localisation' => $armure['localisation'] ?? null,
            'pa' => $armure['pa'] ?? null, 'equipee' => $armure['equipee'] ?? true,
        ], $armures));
        $personnage->objets()->createMany(array_map(fn ($objet) => [
            'objet_type' => $objet['type'], 'objet_id' => $this->id('cpr_' . $objet['type'], $objet['code']),
        ], $objets));
        $ids = [];
        foreach ($cyber as $implant) {
            $ids[$implant['cle']] = $personnage->cyber()->create([
                'cyber_id' => $this->id('cpr_cyber', $implant['cyber']), 'ph' => $implant['ph'] ?? 0,
                'precision' => $implant['precision'] ?? null, 'parent_id' => isset($implant['parent']) ? $ids[$implant['parent']] : null,
            ])->id;
        }

        return app(CprPersonnageCalcul::class)->calculer($personnage->fresh());
    }

    private function id(string $table, string $code): int
    {
        return (int) DB::table($table)->where('code', $code)->value('id');
    }
}
