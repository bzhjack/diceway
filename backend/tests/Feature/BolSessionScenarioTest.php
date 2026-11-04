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

    public function test_loading_a_scene_sets_its_scenario(): void
    {
        $a = $this->scenario('A');
        $b = $this->scenario('B');
        $scene = BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $b->id, 'titre' => 'Scène', 'ordre' => 0, 'distribution' => []]);
        $session = $this->tableSession($a->id);

        $this->postJson("/api/bol/fight-session/{$session->id}/load-scene", ['scene_id' => $scene->id, 'mode' => 'add'])->assertOk();

        $this->assertSame($b->id, $session->fresh()->scenario_id);
        // La table a quitté A pour B : A compte comme joué.
        $this->assertSame([$a->id], $session->fresh()->chapitres_quittes);
    }

    public function test_saving_a_scene_sets_its_scenario(): void
    {
        $a = $this->scenario('A');
        $b = $this->scenario('B');
        $session = $this->tableSession($a->id);

        $this->postJson('/api/bol/scene/create', ['titre' => 'Scène', 'scenario_id' => $b->id, 'session_id' => $session->id])->assertOk();

        $this->assertSame($b->id, $session->fresh()->scenario_id);
    }

    public function test_loading_an_improvised_scene_keeps_the_table_scenario(): void
    {
        $a = $this->scenario('A');
        $scene = BolScene::create(['user_id' => $this->user->id, 'scenario_id' => null, 'titre' => 'Taverne', 'ordre' => 0, 'distribution' => []]);
        $session = $this->tableSession($a->id);

        $this->postJson("/api/bol/fight-session/{$session->id}/load-scene", ['scene_id' => $scene->id, 'mode' => 'add'])->assertOk();

        $fresh = $session->fresh();
        $this->assertSame($a->id, $fresh->scenario_id);
        $this->assertSame($scene->id, $fresh->scene_id);
        $this->assertNull($fresh->chapitres_quittes);
    }

    public function test_saving_an_improvised_scene_keeps_the_table_scenario(): void
    {
        $a = $this->scenario('A');
        $session = $this->tableSession($a->id);

        $response = $this->postJson('/api/bol/scene/create', ['titre' => 'Taverne', 'scenario_id' => null, 'session_id' => $session->id])->assertOk();

        $this->assertNull($response->json('scenario_id'));
        $fresh = $session->fresh();
        $this->assertSame($a->id, $fresh->scenario_id);
        $this->assertSame($response->json('id'), $fresh->scene_id);
    }

    /** « Reprendre » sur un autre chapitre : la même table passe dessus, ses scènes jouées restent jouées. */
    public function test_moves_the_table_to_another_own_chapter(): void
    {
        $a = $this->scenario('A');
        $b = $this->scenario('B');
        $session = $this->tableSession($a->id);
        $session->update(['scenes_jouees' => ['s1']]);

        $response = $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $b->id])->assertOk();

        $this->assertSame($b->id, $response->json('scenario_id'));
        $fresh = $session->fresh();
        $this->assertSame($b->id, $fresh->scenario_id);
        $this->assertSame(['s1'], $fresh->scenes_jouees);
    }

    public function test_a_chapter_of_another_account_or_none_makes_the_table_improvised(): void
    {
        $a = $this->scenario('A');
        $etranger = $this->scenario('Étranger', User::factory()->create());
        $session = $this->tableSession($a->id);

        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $etranger->id])->assertOk();
        $this->assertNull($session->fresh()->scenario_id);

        $session->update(['scenario_id' => $a->id]);
        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => null])->assertOk();
        $this->assertNull($session->fresh()->scenario_id);
    }

    public function test_cannot_move_the_table_of_another_account(): void
    {
        $a = $this->scenario('A');
        $autre = User::factory()->create();
        $table = BolFightSession::create(['titre' => 'Autre', 'statut' => 'libre', 'user_id' => $autre->id, 'scenario_id' => null]);

        $this->patchJson("/api/bol/fight-session/{$table->id}/scenario", ['scenario_id' => $a->id])->assertNotFound();
        $this->assertNull($table->fresh()->scenario_id);
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
