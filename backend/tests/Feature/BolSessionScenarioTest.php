<?php

namespace Tests\Feature;

use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScene;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Une table se souvient du scénario sur lequel elle joue : à la création, au chargement d'une scène, ou par le choix du MJ. */
class BolSessionScenarioTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_creates_a_table_on_an_own_scenario(): void
    {
        $scenario = $this->scenario('Le Dieu voilé');

        $response = $this->postJson('/api/bol/fight-session/create', ['titre' => 'Table', 'scenario_id' => $scenario->id])->assertOk();

        $this->assertSame($scenario->id, $response->json('scenario_id'));
    }

    public function test_ignores_the_scenario_of_another_account_on_create(): void
    {
        $foreign = $this->scenario('Étranger', User::factory()->create());

        $response = $this->postJson('/api/bol/fight-session/create', ['titre' => 'Table', 'scenario_id' => $foreign->id])->assertOk();

        $this->assertNull($response->json('scenario_id'));
    }

    public function test_sets_and_clears_the_scenario_of_a_table(): void
    {
        $scenario = $this->scenario('Le Dieu voilé');
        $session = $this->tableSession();

        $set = $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $scenario->id])->assertOk();
        $this->assertSame($scenario->id, $set->json('scenario_id'));

        $cleared = $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => null])->assertOk();
        $this->assertNull($cleared->json('scenario_id'));
        $this->assertNull($session->fresh()->scenario_id);
    }

    public function test_refuses_the_scenario_or_the_table_of_another_account(): void
    {
        $other = User::factory()->create();
        $foreign = $this->scenario('Étranger', $other);
        $own = $this->scenario('Le Dieu voilé');
        $session = $this->tableSession();
        $foreignSession = BolFightSession::create(['titre' => 'Autre compte', 'statut' => 'libre', 'user_id' => $other->id, 'scenario_id' => $foreign->id]);

        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $foreign->id])->assertNotFound();
        $this->assertNull($session->fresh()->scenario_id);

        $this->patchJson("/api/bol/fight-session/{$foreignSession->id}/scenario", ['scenario_id' => $own->id])->assertNotFound();
        $this->assertSame($foreign->id, $foreignSession->fresh()->scenario_id);
    }

    public function test_loading_a_scene_sets_its_scenario(): void
    {
        $a = $this->scenario('A');
        $b = $this->scenario('B');
        $scene = BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $b->id, 'titre' => 'Scène', 'ordre' => 0, 'distribution' => []]);
        $session = $this->tableSession($a->id);

        $this->postJson("/api/bol/fight-session/{$session->id}/load-scene", ['scene_id' => $scene->id, 'mode' => 'add'])->assertOk();

        $this->assertSame($b->id, $session->fresh()->scenario_id);
    }

    public function test_saving_a_scene_sets_its_scenario(): void
    {
        $a = $this->scenario('A');
        $b = $this->scenario('B');
        $session = $this->tableSession($a->id);

        $this->postJson('/api/bol/scene/create', ['titre' => 'Scène', 'scenario_id' => $b->id, 'session_id' => $session->id])->assertOk();

        $this->assertSame($b->id, $session->fresh()->scenario_id);
    }

    public function test_deleting_the_scenario_clears_it_on_the_table(): void
    {
        $scenario = $this->scenario('Le Dieu voilé');
        $session = $this->tableSession($scenario->id);

        $this->deleteJson("/api/bol/scenario/delete/{$scenario->id}")->assertOk();

        $this->assertNull($session->fresh()->scenario_id);
    }

    private function scenario(string $titre, ?User $owner = null): BolScenario
    {
        return BolScenario::create(['user_id' => ($owner ?? $this->user)->id, 'titre' => $titre]);
    }

    private function tableSession(?string $scenarioId = null): BolFightSession
    {
        return BolFightSession::create(['titre' => 'Table', 'statut' => 'libre', 'user_id' => $this->user->id, 'scenario_id' => $scenarioId]);
    }
}
