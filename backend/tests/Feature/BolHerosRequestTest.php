<?php

namespace Tests\Feature;

use App\Models\Bol\BolCarriere;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * La validation serveur des héros (formulaire principal et éditeur avancé) : les budgets de création (p. 13-16, 45) ne valent que pour un brouillon ;
 * à l'activation, le front envoie les valeurs avec les bonus d'avantages déjà appliqués.
 */
class BolHerosRequestTest extends TestCase
{
    use RefreshDatabase;

    private const NON_COMBATTANT = 33;
    private const ILLETTRE = 17;
    private const ALCHIMISTE = 1;
    private const MEDECIN = 14;
    private const PRETRE = 21;
    private const SCRIBE = 22;
    private const SORCIER = 24;
    private const SOLDAT = 30;

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

    // Le formulaire principal (`/bol/heros/create`, `/bol/heros/update`) subit les mêmes règles que l'éditeur avancé.

    public function test_the_main_form_creates_a_draft_within_the_creation_budgets(): void
    {
        $this->postJson('/api/bol/heros/create', $this->payload())->assertOk();
    }

    public function test_the_main_form_cannot_create_a_draft_over_the_creation_budgets(): void
    {
        $this->postJson('/api/bol/heros/create', $this->payload(['attributs' => $this->attributs(2, 1, 1, 1)]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('attributs', 'errors');
    }

    public function test_the_main_form_cannot_save_a_draft_over_the_creation_budgets(): void
    {
        $id = $this->postJson('/api/bol/heros/create', $this->payload())->assertOk()->json('id');

        $this->postJson('/api/bol/heros/update', $this->updatePayload($id, ['combat' => $this->combat(2, 1, 1, 1)]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('combat', 'errors');
    }

    public function test_the_main_form_activation_skips_the_creation_budgets_but_keeps_sane_bounds(): void
    {
        $id = $this->postJson('/api/bol/heros/create', $this->payload())->assertOk()->json('id');

        $this->postJson('/api/bol/heros/update', $this->updatePayload($id, ['active' => true, 'attributs' => $this->attributs(1, 1, 4, 0)]))
            ->assertOk()
            ->assertJsonPath('active', true);
        $this->postJson('/api/bol/heros/update', $this->updatePayload($id, ['active' => true, 'attributs' => $this->attributs(7, 0, 0, 0)]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('attributs.vigueur', 'errors');
    }

    public function test_the_main_form_still_requires_the_name_and_the_player(): void
    {
        $this->postJson('/api/bol/heros/create', $this->payload(['nom' => '', 'joueur' => '']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['nom', 'joueur'], 'errors');
    }

    // R-ILLETTRE (p. 44, p. 47) : un illettré ne prend pas de carrière de lettré. Comme le front, l'activation est bloquée, pas le brouillon.

    public function test_an_illiterate_hero_cannot_be_activated_with_a_learned_career(): void
    {
        foreach ([self::SCRIBE, self::MEDECIN, self::ALCHIMISTE, self::PRETRE] as $lettree) {
            $this->createAdvanced([
                'active' => true,
                'carrieres' => [$this->carriereNumero($lettree, 1), $this->carriereNumero(self::SOLDAT, 3)],
                'traits' => [$this->illettre()],
            ])->assertStatus(422)->assertJsonValidationErrors('carrieres', 'errors');
        }
    }

    public function test_illiteracy_counts_whether_general_regional_or_from_a_career(): void
    {
        foreach ([['region_id' => 4], ['carriere' => true]] as $origine) {
            $this->createAdvanced([
                'active' => true,
                'carrieres' => [$this->carriereNumero(self::SCRIBE, 1)],
                'traits' => [$this->illettre($origine)],
            ])->assertStatus(422)->assertJsonValidationErrors('carrieres', 'errors');
        }
    }

    public function test_the_main_form_cannot_activate_an_illiterate_scribe(): void
    {
        $id = $this->postJson('/api/bol/heros/create', $this->payload())->assertOk()->json('id');

        $this->postJson('/api/bol/heros/update', $this->updatePayload($id, [
            'active' => true,
            'carrieres' => [$this->carriereNumero(self::SCRIBE, 1)],
            'traits' => [$this->illettre()],
        ]))->assertStatus(422)->assertJsonValidationErrors('carrieres', 'errors');
    }

    public function test_an_illiterate_draft_with_a_learned_career_is_still_saved(): void
    {
        $this->createAdvanced([
            'carrieres' => [$this->carriereNumero(self::SCRIBE, 1)],
            'traits' => [$this->illettre()],
        ])->assertOk();
    }

    public function test_an_illiterate_hero_may_be_activated_without_a_learned_career(): void
    {
        $this->createAdvanced([
            'active' => true,
            'carrieres' => [$this->carriereNumero(self::SOLDAT, 3), $this->carriereNumero(self::SORCIER, 1)],
            'traits' => [$this->illettre()],
        ])->assertOk();
    }

    public function test_an_advantage_numbered_like_illettre_does_not_count(): void
    {
        $this->createAdvanced([
            'active' => true,
            'carrieres' => [$this->carriereNumero(self::SCRIBE, 1)],
            'traits' => [$this->illettre(['type' => 'A'])],
        ])->assertOk();
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

    /** La fiche telle que le formulaire principal l'enregistre : `update` lit aussi origines et ressources. */
    private function updatePayload(string|int $id, array $overrides = []): array
    {
        return $this->payload(array_replace([
            'id' => $id,
            'origines' => ['nom' => 'Aldric', 'joueur' => 'Lionel', 'region_id' => null, 'avatar' => null, 'commentaire' => null],
            'ressources' => ['vitalite' => 10, 'heroisme' => 5, 'foi' => 0, 'pouvoir' => 0, 'creation' => 0],
        ], $overrides));
    }

    /** Une carrière du catalogue sous son id de référence (les ids des carrières lettrées sont fixes). */
    private function carriereNumero(int $id, int $rang): array
    {
        if (!BolCarriere::whereKey($id)->exists()) {
            BolCarriere::forceCreate(['id' => $id, 'carriere' => "Carrière $id"]);
        }

        return ['carriere_id' => $id, 'value' => $rang];
    }

    private function illettre(array $overrides = []): array
    {
        return array_replace([
            'traitable_id' => self::ILLETTRE, 'type' => 'D', 'detail' => null, 'region_id' => null, 'carriere' => false,
        ], $overrides);
    }

    private function nonCombattant(array $overrides = []): array
    {
        return array_replace([
            'traitable_id' => self::NON_COMBATTANT, 'type' => 'D', 'detail' => null, 'region_id' => null, 'carriere' => false,
        ], $overrides);
    }
}
