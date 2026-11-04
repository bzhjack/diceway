<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolFightSessionService;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionHeros;
use App\Models\Bol\BolFightSessionPnj;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolSaga;
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

    /** Une scène d'un autre chapitre du même scénario fait passer la partie sur ce chapitre : le précédent compte comme joué pour elle. */
    public function test_loading_a_scene_of_the_same_scenario_moves_the_partie(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $scene = $this->sceneOf($ch2->id);
        $session = $this->tableSession($ch1->id);

        $this->postJson("/api/bol/fight-session/{$session->id}/load-scene", ['scene_id' => $scene->id, 'mode' => 'add'])->assertOk();

        $this->assertSame($ch2->id, $session->fresh()->scenario_id);
        $this->assertSame([$ch1->id], $session->fresh()->chapitres_quittes);
    }

    /** Une scène d'un autre scénario se charge, mais la partie reste sur le sien. */
    public function test_loading_a_scene_of_another_scenario_keeps_the_partie(): void
    {
        [$ch1] = $this->saga('Perle du Beshaar', 1);
        [$ailleurs] = $this->saga('Le Dieu voilé', 1);
        $scene = $this->sceneOf($ailleurs->id);
        $session = $this->tableSession($ch1->id);

        $this->postJson("/api/bol/fight-session/{$session->id}/load-scene", ['scene_id' => $scene->id, 'mode' => 'add'])->assertOk();

        $fresh = $session->fresh();
        $this->assertSame($ch1->id, $fresh->scenario_id);
        $this->assertSame($scene->id, $fresh->scene_id);
        $this->assertNull($fresh->chapitres_quittes);
    }

    public function test_saving_a_scene_of_the_same_scenario_moves_the_partie(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $session = $this->tableSession($ch1->id);

        $this->postJson('/api/bol/scene/create', ['titre' => 'Scène', 'scenario_id' => $ch2->id, 'session_id' => $session->id])->assertOk();

        $this->assertSame($ch2->id, $session->fresh()->scenario_id);
    }

    public function test_saving_a_scene_of_another_scenario_keeps_the_partie(): void
    {
        $a = $this->scenario('A');
        $b = $this->scenario('B');
        $session = $this->tableSession($a->id);

        $this->postJson('/api/bol/scene/create', ['titre' => 'Scène', 'scenario_id' => $b->id, 'session_id' => $session->id])->assertOk();

        $this->assertSame($a->id, $session->fresh()->scenario_id);
    }

    /** Une partie improvisée prend le scénario de la première scène chargée qui en a un. */
    public function test_an_improvised_partie_takes_the_scenario_of_a_loaded_scene(): void
    {
        $a = $this->scenario('A');
        $scene = $this->sceneOf($a->id);
        $session = $this->tableSession();

        $this->postJson("/api/bol/fight-session/{$session->id}/load-scene", ['scene_id' => $scene->id, 'mode' => 'add'])->assertOk();

        $this->assertSame($a->id, $session->fresh()->scenario_id);
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

    /** « Changer de chapitre » dans son scénario : la même table passe dessus, ses scènes jouées restent jouées, l'ancien est quitté. */
    public function test_moves_the_partie_within_its_scenario(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $session = $this->tableSession($ch1->id);
        $session->update(['scenes_jouees' => ['s1']]);

        $response = $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $ch2->id])->assertOk();

        $this->assertSame($ch2->id, $response->json('scenario_id'));
        $fresh = $session->fresh();
        $this->assertSame($ch2->id, $fresh->scenario_id);
        $this->assertSame(['s1'], $fresh->scenes_jouees);
        $this->assertSame([$ch1->id], $fresh->chapitres_quittes);
    }

    /** Changer de chapitre charge sa première scène : les figurants de l'ancienne partent, les héros restent. */
    public function test_changing_chapter_loads_its_first_scene_and_replaces_the_extras(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $aubergiste = $this->pnj('Aubergiste');
        $garde = $this->pnj('Garde');
        $taverne = $this->sceneAvec($ch1->id, 'La taverne', 0, $aubergiste);
        $this->sceneAvec($ch2->id, 'Le temple', 1, null);
        $desert = $this->sceneAvec($ch2->id, 'Le désert', 0, $garde);
        $session = $this->tableSession($ch1->id);
        $heros = BolHeros::create(['nom' => 'Axel', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'H']);
        BolFightSessionHeros::create(['fight_session_id' => $session->id, 'heros_id' => $heros->id, 'camp' => 'heros']);
        $this->postJson("/api/bol/fight-session/{$session->id}/load-scene", ['scene_id' => $taverne->id, 'mode' => 'add'])->assertOk();

        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $ch2->id])
            ->assertOk()
            ->assertJsonPath('scene_id', $desert->id)
            ->assertJsonPath('scenario_id', $ch2->id);

        $this->assertSame([$garde->id], BolFightSessionPnj::where('fight_session_id', $session->id)->pluck('pnj_id')->all());
        $this->assertSame(1, BolFightSessionHeros::where('fight_session_id', $session->id)->count());
        $this->assertSame([$taverne->id, $desert->id], $session->fresh()->scenes_jouees);
    }

    /** Les alliés de la compagnie la suivent de chapitre en chapitre, avec leur état ; seuls les adversaires partent. */
    public function test_changing_chapter_keeps_the_allies_of_the_company(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $compagnon = $this->pnj('Compagnon');
        $aubergiste = $this->pnj('Aubergiste');
        $this->sceneAvec($ch2->id, 'Le désert', 0, null);
        $session = $this->tableSession($ch1->id);
        $ligne = BolFightSessionPnj::create($this->lignePnj($session->id, $compagnon->id, 'heros', 3));
        BolFightSessionPnj::create($this->lignePnj($session->id, $aubergiste->id, 'adversaires', 8));

        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $ch2->id])->assertOk();

        $restants = BolFightSessionPnj::where('fight_session_id', $session->id)->get();
        $this->assertSame([$ligne->id], $restants->pluck('id')->all());
        $this->assertSame(3, $restants[0]->vitalite_courante);
    }

    /** Un allié déjà à la table n'est pas posé une seconde fois par la scène qui le cite. */
    public function test_changing_chapter_does_not_duplicate_an_ally_the_scene_also_lists(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $compagnon = $this->pnj('Compagnon');
        BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $ch2->id, 'titre' => 'Le désert', 'ordre' => 0, 'distribution' => [
            ['kind' => 'pnj', 'source_id' => $compagnon->id, 'qty' => 1, 'camp' => 'heros'],
        ]]);
        $session = $this->tableSession($ch1->id);
        BolFightSessionPnj::create($this->lignePnj($session->id, $compagnon->id, 'heros', 3));

        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $ch2->id])->assertOk();

        $this->assertSame([3], BolFightSessionPnj::where('fight_session_id', $session->id)->pluck('vitalite_courante')->all());
    }

    /** Charger une scène en « Remplacer », à la table, retire toujours tout sauf les héros : c'est ce que dit son dialogue. */
    public function test_replacing_a_scene_at_the_table_still_removes_the_allies(): void
    {
        [$ch1] = $this->saga('Perle du Beshaar', 1);
        $scene = $this->sceneAvec($ch1->id, 'La taverne', 0, null);
        $session = $this->tableSession($ch1->id);
        BolFightSessionPnj::create($this->lignePnj($session->id, $this->pnj('Compagnon')->id, 'heros', 3));

        $this->postJson("/api/bol/fight-session/{$session->id}/load-scene", ['scene_id' => $scene->id, 'mode' => 'replace'])->assertOk();

        $this->assertSame(0, BolFightSessionPnj::where('fight_session_id', $session->id)->count());
    }

    /** Si la scène ne se charge pas, le chapitre ne change pas non plus : on peut réessayer. */
    public function test_a_failed_chapter_change_leaves_the_partie_untouched(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $this->sceneAvec($ch2->id, 'Le désert', 0, $this->pnj('Garde'));
        $session = $this->tableSession($ch1->id);
        $this->partialMock(BolFightSessionService::class, fn ($mock) => $mock->shouldReceive('createPnjRow')->andThrow(new \RuntimeException('panne')));

        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $ch2->id])->assertServerError();

        $fresh = $session->fresh();
        $this->assertSame($ch1->id, $fresh->scenario_id);
        $this->assertNull($fresh->chapitres_quittes);
    }

    /** Un chapitre sans scène n'a rien à mettre à la place : la table n'est plus sur l'ancienne scène, mais rien n'en est retiré. */
    public function test_changing_to_a_chapter_without_scene_keeps_the_extras(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $taverne = $this->sceneAvec($ch1->id, 'La taverne', 0, $this->pnj('Aubergiste'));
        $session = $this->tableSession($ch1->id);
        $this->postJson("/api/bol/fight-session/{$session->id}/load-scene", ['scene_id' => $taverne->id, 'mode' => 'add'])->assertOk();

        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $ch2->id])->assertOk()->assertJsonPath('scene_id', null);

        $this->assertSame(1, BolFightSessionPnj::where('fight_session_id', $session->id)->count());
    }

    /** Rester sur le même chapitre ne recharge rien. */
    public function test_choosing_the_same_chapter_changes_nothing(): void
    {
        [$ch1] = $this->saga('Perle du Beshaar', 1);
        $this->sceneAvec($ch1->id, 'La taverne', 0, null);
        $temple = $this->sceneAvec($ch1->id, 'Le temple', 1, $this->pnj('Prêtre'));
        $session = $this->tableSession($ch1->id);
        $this->postJson("/api/bol/fight-session/{$session->id}/load-scene", ['scene_id' => $temple->id, 'mode' => 'add'])->assertOk();

        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $ch1->id])->assertOk()->assertJsonPath('scene_id', $temple->id);

        $this->assertSame(1, BolFightSessionPnj::where('fight_session_id', $session->id)->count());
    }

    /** Pendant un combat, on ne change pas de chapitre, comme on n'y charge pas de scène : rien ne bouge. */
    public function test_changing_chapter_is_refused_during_a_combat(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $taverne = $this->sceneAvec($ch1->id, 'La taverne', 0, $this->pnj('Aubergiste'));
        $this->sceneAvec($ch2->id, 'Le désert', 0, null);
        $session = $this->tableSession($ch1->id);
        $this->postJson("/api/bol/fight-session/{$session->id}/load-scene", ['scene_id' => $taverne->id, 'mode' => 'add'])->assertOk();
        $session->fresh()->update(['statut' => 'combat']);

        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $ch2->id])->assertStatus(409);

        $fresh = $session->fresh();
        $this->assertSame($ch1->id, $fresh->scenario_id);
        $this->assertSame($taverne->id, $fresh->scene_id);
        $this->assertSame(1, BolFightSessionPnj::where('fight_session_id', $session->id)->count());
    }

    /** La première scène du chapitre cite une fiche supprimée : le changement a lieu, et la réponse le dit. */
    public function test_changing_chapter_tells_how_many_extras_no_longer_exist(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $ch2->id, 'titre' => 'Le désert', 'ordre' => 0, 'distribution' => [
            ['kind' => 'pnj', 'source_id' => '00000000-0000-0000-0000-000000000000', 'qty' => 1, 'camp' => 'adversaires'],
        ]]);
        $session = $this->tableSession($ch1->id);

        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $ch2->id])->assertOk()->assertJsonPath('figurants_ignores', 1);
    }

    /** Une partie improvisée qui reçoit un scénario charge sa première scène, sans rien retirer de ce qui est posé à la main. */
    public function test_an_improvised_partie_given_a_scenario_keeps_what_is_on_the_table(): void
    {
        [$ch1] = $this->saga('Perle du Beshaar', 1);
        $garde = $this->pnj('Garde');
        $improvisee = $this->sceneAvec(null, 'Improvisée', 0, $this->pnj('Marchand'));
        $desert = $this->sceneAvec($ch1->id, 'Le désert', 0, $garde);
        $session = $this->tableSession();
        $this->postJson("/api/bol/fight-session/{$session->id}/load-scene", ['scene_id' => $improvisee->id, 'mode' => 'add'])->assertOk();

        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $ch1->id])->assertOk()->assertJsonPath('scene_id', $desert->id);

        $this->assertSame(2, BolFightSessionPnj::where('fight_session_id', $session->id)->count());
    }

    /** Une partie liée à un scénario n'en change pas, et ne redevient pas improvisée ; un chapitre d'un autre compte n'en est pas un. */
    public function test_refuses_to_move_a_partie_out_of_its_scenario(): void
    {
        [$ch1] = $this->saga('Perle du Beshaar', 1);
        [$ailleurs] = $this->saga('Le Dieu voilé', 1);
        $oneShot = $this->scenario('Un ennui mortel');
        $etranger = $this->scenario('Étranger', User::factory()->create());
        $session = $this->tableSession($ch1->id);

        foreach ([$ailleurs->id, $oneShot->id, $etranger->id, null] as $cible) {
            $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $cible])
                ->assertUnprocessable()
                ->assertJsonPath('error', 'Ce chapitre n’est pas du scénario de la partie.');
        }
        $this->assertSame($ch1->id, $session->fresh()->scenario_id);
    }

    /** Une partie improvisée reçoit un scénario une fois ; ensuite elle y reste. */
    public function test_an_improvised_partie_takes_a_scenario_once(): void
    {
        [$ch1] = $this->saga('Perle du Beshaar', 1);
        $autre = $this->scenario('Un ennui mortel');
        $session = $this->tableSession();

        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $ch1->id])->assertOk();
        $this->patchJson("/api/bol/fight-session/{$session->id}/scenario", ['scenario_id' => $autre->id])->assertUnprocessable();

        $this->assertSame($ch1->id, $session->fresh()->scenario_id);
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

    /** @return array<int, BolScenario> les chapitres 1 à `$n` d'une saga du compte */
    private function saga(string $titre, int $n): array
    {
        $saga = BolSaga::create(['user_id' => $this->user->id, 'titre' => $titre]);

        return array_map(
            fn (int $numero) => BolScenario::create(['user_id' => $this->user->id, 'saga_id' => $saga->id, 'numero' => $numero, 'titre' => "Chapitre $numero"]),
            range(1, $n),
        );
    }

    /** @return array<string, mixed> une ligne de PNJ à la table, sans passer par la fiche */
    private function lignePnj(string $sessionId, string $pnjId, string $camp, int $vitalite): array
    {
        return ['fight_session_id' => $sessionId, 'pnj_id' => $pnjId, 'camp' => $camp, 'rang' => 'coriace', 'nom' => 'PNJ', 'vigueur' => 0, 'agilite' => 0, 'esprit' => 0, 'aura' => 0, 'melee' => 0, 'tir' => 0, 'defense' => 0, 'vitalite_courante' => $vitalite, 'vitalite_max' => 8];
    }

    private function pnj(string $nom): BolHeros
    {
        return BolHeros::create(['nom' => $nom, 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'C']);
    }

    private function sceneAvec(?string $scenarioId, string $titre, int $ordre, ?BolHeros $figurant): BolScene
    {
        return BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $scenarioId, 'titre' => $titre, 'ordre' => $ordre, 'distribution' => $figurant ? [
            ['kind' => 'pnj', 'source_id' => $figurant->id, 'qty' => 1, 'camp' => 'adversaires'],
        ] : []]);
    }

    private function sceneOf(?string $scenarioId): BolScene
    {
        return $this->sceneAvec($scenarioId, 'Scène', 0, null);
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
