<?php

namespace Tests\Feature;

use App\Models\Bol\BolCarriere;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * La validation serveur de l'éditeur avancé : les budgets de création (p. 13-16, 45) ne valent que pour un brouillon ;
 * à l'activation, le front envoie les valeurs avec les bonus d'avantages déjà appliqués.
 */
class BolHerosRequestTest extends TestCase
{
    use RefreshDatabase;

    private const NON_COMBATTANT = 33;

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->create());
    }

    public function test_a_draft_with_non_combattant_may_spend_six_career_points(): void
    {
        $this->createAdvanced([
            'combat' => $this->combat(1, 1, 0, 0),
            'carrieres' => $this->carrieres([2, 2, 1, 1]),
            'traits' => [$this->nonCombattant()],
        ])->assertOk();
    }

    public function test_a_draft_without_non_combattant_cannot_spend_six_career_points(): void
    {
        $this->createAdvanced(['carrieres' => $this->carrieres([2, 2, 1, 1])])
            ->assertStatus(422)
            ->assertJsonValidationErrors('carrieres', 'errors');
    }

    public function test_a_draft_with_non_combattant_cannot_spend_seven_career_points(): void
    {
        $this->createAdvanced([
            'combat' => $this->combat(1, 1, 0, 0),
            'carrieres' => $this->carrieres([3, 2, 1, 1]),
            'traits' => [$this->nonCombattant()],
        ])->assertStatus(422)->assertJsonValidationErrors('carrieres', 'errors');
    }

    public function test_a_career_disadvantage_numbered_like_non_combattant_does_not_count(): void
    {
        $this->createAdvanced(['carrieres' => $this->carrieres([2, 2, 1, 1]), 'traits' => [$this->nonCombattant(['carriere' => true])]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('carrieres', 'errors');
    }

    public function test_a_draft_with_non_combattant_is_limited_to_two_combat_points(): void
    {
        $this->createAdvanced(['combat' => $this->combat(1, 1, 1, 0), 'traits' => [$this->nonCombattant()]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('combat', 'errors');

        $this->createAdvanced(['combat' => $this->combat(1, 0, 0, 1), 'traits' => [$this->nonCombattant()]])->assertOk();
    }

    public function test_a_draft_cannot_start_an_attribute_at_four(): void
    {
        $this->createAdvanced(['attributs' => $this->attributs(4, 0, 0, 0)])
            ->assertStatus(422)
            ->assertJsonValidationErrors('attributs.vigueur', 'errors');
    }

    public function test_a_draft_cannot_spend_more_than_four_attribute_points(): void
    {
        $this->createAdvanced(['attributs' => $this->attributs(2, 1, 1, 1)])
            ->assertStatus(422)
            ->assertJsonValidationErrors('attributs', 'errors');
    }

    public function test_a_draft_allows_only_one_negative_attribute(): void
    {
        $this->createAdvanced(['attributs' => $this->attributs(-1, -1, 3, 2)])
            ->assertStatus(422)
            ->assertJsonValidationErrors('attributs', 'errors');

        $this->createAdvanced(['attributs' => $this->attributs(-1, 1, 2, 2)])->assertOk();
    }

    public function test_a_draft_allows_only_one_negative_combat_aptitude(): void
    {
        $this->createAdvanced(['combat' => $this->combat(-1, -1, 3, 3)])
            ->assertStatus(422)
            ->assertJsonValidationErrors('combat', 'errors');
    }

    public function test_an_activation_keeps_the_advantage_bonuses_it_carries(): void
    {
        // Savant : +1 en esprit, déjà ajouté à la répartition 1/1/3/0 (somme 4 à la création, 5 une fois activé).
        $this->createAdvanced(['active' => true, 'attributs' => $this->attributs(1, 1, 4, 0)])->assertOk();
    }

    public function test_an_activation_skips_the_creation_budgets(): void
    {
        $this->createAdvanced([
            'active' => true,
            'attributs' => $this->attributs(-1, -1, 4, 4),
            'combat' => $this->combat(3, 3, 3, -1),
            'carrieres' => $this->carrieres([3, 3, 3, 3]),
        ])->assertOk();
    }

    public function test_an_activation_still_has_sane_bounds(): void
    {
        $this->createAdvanced(['active' => true, 'attributs' => $this->attributs(7, 0, 0, 0)])
            ->assertStatus(422)
            ->assertJsonValidationErrors('attributs.vigueur', 'errors');
        $this->createAdvanced(['active' => true, 'attributs' => $this->attributs(-2, 0, 0, 0)])->assertStatus(422);
        $this->createAdvanced(['active' => true, 'combat' => $this->combat(0, 0, 0, 7)])
            ->assertStatus(422)
            ->assertJsonValidationErrors('combat.defense', 'errors');
        $this->createAdvanced(['active' => true, 'carrieres' => $this->carrieres([6, 0, 0, 0])])
            ->assertStatus(422)
            ->assertJsonValidationErrors('carrieres.0.value', 'errors');
    }

    public function test_the_name_and_the_player_stay_required_for_an_active_hero(): void
    {
        $this->createAdvanced(['active' => true, 'nom' => '', 'joueur' => ''])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['nom', 'joueur'], 'errors');
    }

    public function test_an_already_active_hero_is_saved_with_its_bonuses(): void
    {
        $id = $this->createAdvanced()->assertOk()->json('id');

        $this->postJson('/api/bol/heros/update/advanced', $this->payload([
            'id' => $id,
            'active' => true,
            'attributs' => $this->attributs(1, 1, 4, 0),
            'origines' => ['nom' => 'Aldric', 'joueur' => 'Lionel', 'region_id' => null, 'avatar' => null, 'commentaire' => null],
            'ressources' => ['vitalite' => 11, 'heroisme' => 5, 'foi' => 0, 'pouvoir' => 0, 'creation' => 0],
        ]))->assertOk()->assertJsonPath('active', true)->assertJsonPath('attributs.esprit', 4);
    }

    private function createAdvanced(array $overrides = [])
    {
        return $this->postJson('/api/bol/heros/create/advanced', $this->payload($overrides));
    }

    /** Une fiche en brouillon comme l'éditeur avancé l'envoie : nom et joueur à la racine, répartition valide. */
    private function payload(array $overrides = []): array
    {
        return array_replace([
            'nom' => 'Aldric',
            'joueur' => 'Lionel',
            'type' => 'H',
            'active' => false,
            'attributs' => $this->attributs(1, 1, 1, 1),
            'combat' => $this->combat(1, 1, 1, 1),
            'carrieres' => $this->carrieres([1, 1, 1, 1]),
            'traits' => [],
        ], $overrides);
    }

    private function attributs(int $vigueur, int $agilite, int $esprit, int $aura): array
    {
        return compact('vigueur', 'agilite', 'esprit', 'aura');
    }

    private function combat(int $initiative, int $melee, int $tir, int $defense): array
    {
        return compact('initiative', 'melee', 'tir', 'defense');
    }

    /** @param list<int> $rangs */
    private function carrieres(array $rangs): array
    {
        return array_map(
            fn (int $rang) => ['carriere_id' => BolCarriere::create(['carriere' => 'Carrière ' . uniqid()])->id, 'value' => $rang],
            $rangs,
        );
    }

    private function nonCombattant(array $overrides = []): array
    {
        return array_replace([
            'traitable_id' => self::NON_COMBATTANT, 'type' => 'D', 'detail' => null, 'region_id' => null, 'carriere' => false,
        ], $overrides);
    }
}
