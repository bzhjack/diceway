<?php

namespace Tests\Feature;

use App\Models\Cpr\CprCompetence;
use App\Models\Cpr\CprRole;
use App\Models\Cpr\CprRoleCompetence;
use App\Models\Cpr\CprRoleProfil;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cyberpunk RED : rôles, compétences et tables de CARAC, remplis par la migration d'après le livre (doc/cyberpunk/resources/roles.md). */
class CprRolesCompetencesTest extends TestCase
{
    use RefreshDatabase;

    private const BASE = [
        'athletisme', 'bagarre', 'concentration', 'connaissance', 'conversation', 'discretion', 'esquive', 'guide_local', 'langue',
        'perception', 'persuasion', 'premiers_secours', 'psychologie',
    ];

    public function test_the_catalogue_is_complete(): void
    {
        $this->assertSame(10, CprRole::count());
        $this->assertSame(68, CprCompetence::count());
        $this->assertSame(200, CprRoleCompetence::count());
        $this->assertSame(100, CprRoleProfil::count());
    }

    public function test_the_base_skills_are_the_thirteen_of_the_book(): void
    {
        $this->assertEqualsCanonicalizing(self::BASE, CprCompetence::where('de_base', true)->pluck('code')->all());
        $this->assertSame('argot', $this->competence('langue')->precision_de_base);
        $this->assertSame("quartier d'origine", $this->competence('guide_local')->precision_de_base);
    }

    public function test_skills_match_the_book(): void
    {
        $this->assertSkill('tir_automatique', 'ref', 'tir', 2);
        $this->assertSkill('dissimulation_revelation_d_objet', 'int', 'vigilance', 1);
        $this->assertSkill('conversation', 'emp', 'sociabilite', 1);
        $this->assertSkill('instrument', 'tech', 'representation', 1);
        $this->assertSkill('art_martial', 'dex', 'combat', 2);
        $this->assertSkill('pilotage_de_vehicule_aerien', 'ref', 'controle', 2);
        $this->assertSame(
            ['armes_lourdes', 'art_martial', 'assistance_medicale', 'explosifs', 'pilotage_de_vehicule_aerien', 'securite_electronique', 'tir_automatique'],
            CprCompetence::where('cout', 2)->orderBy('code')->pluck('code')->all(),
        );
        $this->assertSame('forme', $this->competence('art_martial')->specialite);
    }

    public function test_surgery_and_medical_tech_belong_to_the_medtech(): void
    {
        $medtech = $this->role('medtech');
        $this->assertEqualsCanonicalizing(
            ['chirurgie', 'techniques_medicales'],
            CprCompetence::whereNotNull('reservee_role_id')->pluck('code')->all(),
        );
        $this->assertSame($medtech->id, $this->competence('chirurgie')->reservee_role_id);
    }

    public function test_every_role_has_the_thirteen_base_skills_and_seven_of_its_own(): void
    {
        foreach (CprRole::with('competences.competence')->get() as $role) {
            $competences = $role->competences;
            $this->assertCount(20, $competences, $role->code);
            $this->assertCount(7, $competences->where('de_role', true), $role->code);
            $this->assertEqualsCanonicalizing(
                self::BASE,
                $competences->where('de_role', false)->map(fn ($ligne) => $ligne->competence->code)->values()->all(),
                $role->code,
            );
            foreach ($competences as $ligne) {
                $this->assertContains($ligne->niveau_rat_des_rues, [2, 4, 6], "{$role->code} {$ligne->competence->code}");
                $this->assertNull($ligne->competence->reservee_role_id);
            }
        }
    }

    public function test_street_rat_levels_match_the_book(): void
    {
        $this->assertLevel('solo', 'esquive', 6);
        $this->assertLevel('solo', 'perception', 6);
        $this->assertLevel('solo', 'tir_automatique', 6);
        $this->assertLevel('rockeur', 'guide_local', 4);
        $this->assertLevel('fixer', 'langue', 4);
        $this->assertLevel('fixer', 'crochetage', 4);
        $this->assertLevel('medtech', 'cybertech', 4);
        $this->assertLevel('nomade', 'perception', 4);
        $this->assertLevel('media', 'photos_et_films', 4);

        $langue = $this->ligne('fixer', 'langue');
        $this->assertSame('argot', $langue->precision);
        $this->assertNull($this->ligne('rockeur', 'instrument')->precision);
    }

    public function test_stat_tables_match_the_book(): void
    {
        // L'exemple du livre (p. 73) : un Solo qui fait 6 sur son d10.
        $this->assertProfile('solo', 6, [7, 7, 6, 5, 7, 6, 6, 7, 7, 5]);
        $this->assertProfile('rockeur', 1, [7, 6, 6, 5, 6, 8, 7, 7, 3, 8]);
        $this->assertProfile('netrunner', 10, [7, 8, 6, 6, 6, 4, 7, 7, 5, 6]);
        $this->assertProfile('nomade', 2, [5, 7, 6, 5, 8, 8, 8, 7, 5, 4]);

        foreach (CprRole::with('profils')->get() as $role) {
            $this->assertSame(range(1, 10), $role->profils->pluck('jet')->all(), $role->code);
            foreach ($role->profils as $profil) {
                foreach (['int', 'ref', 'dex', 'tech', 'pres', 'vol', 'cha', 'mouv', 'cor', 'emp'] as $carac) {
                    $this->assertGreaterThanOrEqual(2, $profil->$carac, "{$role->code} {$profil->jet} {$carac}");
                    $this->assertLessThanOrEqual(8, $profil->$carac, "{$role->code} {$profil->jet} {$carac}");
                }
            }
        }
    }

    public function test_the_reference_requires_an_account(): void
    {
        $this->getJson('/api/cpr/reference')->assertUnauthorized();
    }

    public function test_any_account_reads_the_reference(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $response = $this->getJson('/api/cpr/reference')->assertOk();

        $response->assertJsonCount(10, 'roles');
        $response->assertJsonCount(68, 'competences');
        $response->assertJsonPath('roles.0.code', 'rockeur');
        $response->assertJsonPath('roles.1.capacite', 'Conscience tactique');
        $response->assertJsonCount(20, 'roles.1.competences');
        $response->assertJsonCount(10, 'roles.1.profils');
        $response->assertJsonPath('roles.1.profils.5', [
            'jet' => 6, 'int' => 7, 'ref' => 7, 'dex' => 6, 'tech' => 5, 'pres' => 7, 'vol' => 6, 'cha' => 6, 'mouv' => 7, 'cor' => 7, 'emp' => 5,
        ]);
    }

    private function role(string $code): CprRole
    {
        return CprRole::where('code', $code)->firstOrFail();
    }

    private function competence(string $code): CprCompetence
    {
        return CprCompetence::where('code', $code)->firstOrFail();
    }

    private function ligne(string $role, string $competence): CprRoleCompetence
    {
        return CprRoleCompetence::where('role_id', $this->role($role)->id)
            ->where('competence_id', $this->competence($competence)->id)
            ->firstOrFail();
    }

    private function assertSkill(string $code, string $carac, string $categorie, int $cout): void
    {
        $competence = $this->competence($code);
        $this->assertSame([$carac, $categorie, $cout], [$competence->carac, $competence->categorie, $competence->cout], $code);
    }

    private function assertLevel(string $role, string $competence, int $niveau): void
    {
        $this->assertSame($niveau, $this->ligne($role, $competence)->niveau_rat_des_rues, "{$role} {$competence}");
    }

    /** @param int[] $caracs INT, RÉF, DEX, TECH, PRES, VOL, CHA, MOUV, COR, EMP */
    private function assertProfile(string $role, int $jet, array $caracs): void
    {
        $profil = CprRoleProfil::where('role_id', $this->role($role)->id)->where('jet', $jet)->firstOrFail();
        $this->assertSame(
            $caracs,
            [$profil->int, $profil->ref, $profil->dex, $profil->tech, $profil->pres, $profil->vol, $profil->cha, $profil->mouv, $profil->cor, $profil->emp],
            "{$role} {$jet}",
        );
    }
}
