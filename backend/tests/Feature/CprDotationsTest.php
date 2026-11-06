<?php

namespace Tests\Feature;

use App\Models\Cpr\CprArme;
use App\Models\Cpr\CprCyber;
use App\Models\Cpr\CprRole;
use App\Models\Cpr\CprRoleDotation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cyberpunk RED : l'équipement de départ des rôles, rempli par la migration d'après le livre (doc/cyberpunk/resources/roles.md). */
class CprDotationsTest extends TestCase
{
    use RefreshDatabase;

    /** PH totale des implants de départ (p. 117-118), avec la première alternative de chaque choix. Solo : la somme réelle (décision du 2026-11-06). */
    private const PH_DE_DEPART = [
        'rockeur' => 9, 'solo' => 21, 'netrunner' => 14, 'techie' => 12, 'medtech' => 12,
        'media' => 10, 'justicier' => 10, 'corporatiste' => 12, 'fixer' => 16, 'nomade' => 14,
    ];

    public function test_every_role_has_its_starting_kit(): void
    {
        $this->assertSame(238, CprRoleDotation::count());
        $this->assertSame(
            ['corporatiste' => 18, 'fixer' => 25, 'justicier' => 26, 'media' => 25, 'medtech' => 25, 'netrunner' => 23, 'nomade' => 29, 'rockeur' => 27, 'solo' => 19, 'techie' => 21],
            CprRole::withCount('dotations')->orderBy('code')->pluck('dotations_count', 'code')->all(),
        );
    }

    public function test_every_role_wears_a_light_armorjack_on_head_and_body(): void
    {
        foreach (CprRole::with('dotations')->get() as $role) {
            $armures = $role->dotations->where('objet_type', 'armure')->where('precision', '!=', null)->pluck('precision')->sort()->values()->all();
            $this->assertSame(['corps', 'tete'], $armures, $role->code);
        }
    }

    public function test_starting_humanity_loss_matches_the_book(): void
    {
        foreach (CprRole::with('dotations')->get() as $role) {
            $premiers = $role->dotations->where('objet_type', 'cyber')->groupBy('groupe')->map(fn ($alternatives) => $alternatives->first()->objet_id);
            $ph = CprCyber::whereIn('id', $premiers->values())->sum('ph_fixe');
            $this->assertSame(self::PH_DE_DEPART[$role->code], (int) $ph, $role->code);
        }
    }

    public function test_choices_are_groups_of_alternatives(): void
    {
        $techie = $this->groupe('techie', 1);
        $this->assertSame(['fusil_a_pompe', 'fusil_d_assaut'], CprArme::whereIn('id', $techie->pluck('objet_id'))->orderBy('code')->pluck('code')->all());

        $solo = CprRole::where('code', 'solo')->firstOrFail()->dotations->where('objet_type', 'cyber');
        $choix = $solo->groupBy('groupe')->first(fn ($alternatives) => $alternatives->count() === 2);
        $this->assertSame(['etripeurs', 'kerenzikov'], CprCyber::whereIn('id', $choix->pluck('objet_id'))->orderBy('code')->pluck('code')->all());
    }

    public function test_the_nomad_gets_four_family_garage_choices(): void
    {
        $garage = CprRoleDotation::where('objet_type', 'garage_familial')->get();
        $this->assertCount(1, $garage);
        $this->assertSame([4, null], [$garage->first()->quantite, $garage->first()->objet_id]);
        $this->assertSame('nomade', CprRole::find($garage->first()->role_id)->code);
    }

    public function test_ammunition_carries_its_type(): void
    {
        $munitions = CprRoleDotation::where('objet_type', 'munition')->get();
        $this->assertNotEmpty($munitions);
        foreach ($munitions as $munition) {
            $this->assertContains($munition->precision, ['pistolet_l', 'pistolet_tl', 'slug', 'fusil', 'chevrotine', 'grenade']);
        }
    }

    public function test_the_reference_serves_the_kits_with_the_roles(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/cpr/reference')->assertOk()
            ->assertJsonCount(19, 'roles.1.dotations')
            ->assertJsonPath('roles.1.dotations.0.objet_type', 'arme');
    }

    private function groupe(string $role, int $groupe)
    {
        return CprRoleDotation::where('role_id', CprRole::where('code', $role)->value('id'))->where('groupe', $groupe)->get();
    }
}
