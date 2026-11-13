<?php

namespace Tests\Feature;

use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolScene;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** « Préparer la scène » enregistre ses personnages : les fiches du compte et du catalogue, jamais celles d'un autre compte. */
class BolSceneDistributionSaisieTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_the_characters_of_a_scene_are_saved_with_their_count_camp_and_attitude(): void
    {
        $pnj = BolHeros::create(['nom' => 'Aubergiste', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'C']);
        $loup = BolCreature::create(['nom' => 'Loup', 'user_id' => null]);
        $demon = BolDemon::create(['nom' => 'Xothar', 'user_id' => $this->user->id]);
        $scene = $this->scene([]);

        $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'distribution' => [
            ['kind' => 'pnj', 'source_id' => $pnj->id, 'qty' => 3, 'camp' => 'heros', 'attitude' => 'amical'],
            ['kind' => 'creature', 'source_id' => $loup->id, 'qty' => 3, 'camp' => 'adversaires', 'attitude' => 'hostile'],
            ['kind' => 'demon', 'source_id' => $demon->id, 'qty' => 1, 'camp' => null, 'attitude' => null],
        ]])->assertOk();

        $this->assertSame([
            ['kind' => 'pnj', 'source_id' => $pnj->id, 'qty' => 3, 'camp' => 'heros', 'attitude' => 'amical'],
            ['kind' => 'creature', 'source_id' => $loup->id, 'qty' => 3, 'camp' => 'adversaires', 'attitude' => 'hostile'],
            ['kind' => 'demon', 'source_id' => $demon->id, 'qty' => 1, 'camp' => 'adversaires', 'attitude' => null],
        ], $scene->fresh()->distribution);
    }

    public function test_a_sheet_of_another_account_or_a_hero_is_left_out(): void
    {
        $etranger = User::factory()->create()->id;
        $sienne = BolCreature::create(['nom' => 'Rat', 'user_id' => $etranger]);
        $heros = BolHeros::create(['nom' => 'Axel', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'H']);
        $mienne = BolCreature::create(['nom' => 'Loup', 'user_id' => $this->user->id]);
        $scene = $this->scene([]);

        $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'distribution' => [
            ['kind' => 'creature', 'source_id' => $sienne->id, 'qty' => 1],
            ['kind' => 'pnj', 'source_id' => $heros->id, 'qty' => 1],
            ['kind' => 'creature', 'source_id' => $mienne->id, 'qty' => 2],
        ]])->assertOk();

        $this->assertSame([$mienne->id], array_column($scene->fresh()->distribution, 'source_id'));
    }

    /** Trois gardes d'une même fiche, deux lignes du même PNJ (l'un adversaire, l'autre allié) : tout est gardé. */
    public function test_the_same_pnj_may_enter_the_scene_several_times(): void
    {
        $garde = BolHeros::create(['nom' => 'Garde', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'P']);
        $scene = $this->scene([]);

        $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'distribution' => [
            ['kind' => 'pnj', 'source_id' => $garde->id, 'qty' => 3],
            ['kind' => 'pnj', 'source_id' => $garde->id, 'qty' => 1, 'camp' => 'heros'],
        ]])->assertOk();

        $distribution = $scene->fresh()->distribution;
        $this->assertSame([3, 1], array_column($distribution, 'qty'));
        $this->assertSame(['adversaires', 'heros'], array_column($distribution, 'camp'));
    }

    public function test_a_sheet_without_a_pnj_type_is_not_a_pnj(): void
    {
        $sansType = BolHeros::create(['nom' => 'Inconnu', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => '']);
        $scene = $this->scene([]);

        $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'distribution' => [['kind' => 'pnj', 'source_id' => $sansType->id, 'qty' => 1]]])->assertOk();

        $this->assertSame([], $scene->fresh()->distribution);
    }

    public function test_a_wrong_kind_or_count_is_refused(): void
    {
        $scene = $this->scene([]);

        $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'distribution' => [['kind' => 'hero', 'source_id' => 'x', 'qty' => 1]]])->assertStatus(422);
        $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'distribution' => [['kind' => 'creature', 'source_id' => 'x', 'qty' => 0]]])->assertStatus(422);
    }

    public function test_an_update_without_distribution_keeps_the_characters(): void
    {
        $loup = BolCreature::create(['nom' => 'Loup', 'user_id' => $this->user->id]);
        $entree = ['kind' => 'creature', 'source_id' => $loup->id, 'qty' => 1, 'camp' => 'adversaires', 'attitude' => null];
        $scene = $this->scene([$entree]);

        $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'titre' => 'La cave'])->assertOk();

        $this->assertSame([$entree], $scene->fresh()->distribution);
    }

    private function scene(array $distribution): BolScene
    {
        return BolScene::create(['user_id' => $this->user->id, 'scenario_id' => null, 'titre' => 'La taverne', 'ordre' => 0, 'distribution' => $distribution]);
    }
}
