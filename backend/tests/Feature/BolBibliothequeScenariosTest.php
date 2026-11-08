<?php

namespace Tests\Feature;

use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolSaga;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScene;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** La bibliothèque des scénarios : une scène y naît vide, un scénario s'y renomme et s'y supprime d'un bloc. */
class BolBibliothequeScenariosTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_a_scene_created_without_a_table_is_empty_and_goes_last_in_its_chapter(): void
    {
        $chapitre = $this->chapitre('Le Dieu voilé — 1. L’oracle de Nemmereth');
        $this->postJson('/api/bol/scene/create', ['titre' => 'Première', 'scenario_id' => $chapitre['id']])->assertOk();

        $scene = $this->postJson('/api/bol/scene/create', ['titre' => 'Seconde', 'scenario_id' => $chapitre['id']])->assertOk()->json();

        $this->assertSame([], $scene['distribution']);
        $this->assertSame(1, $scene['ordre']);
    }

    public function test_a_scene_cannot_go_in_another_accounts_chapter(): void
    {
        $etranger = BolScenario::create(['user_id' => User::factory()->create()->id, 'titre' => 'Ailleurs']);

        $this->postJson('/api/bol/scene/create', ['titre' => 'Intrus', 'scenario_id' => $etranger->id])->assertNotFound();
    }

    public function test_a_scenario_is_renamed_unless_another_one_has_that_name(): void
    {
        $saga = $this->saga($this->chapitre('Le Dieu voilé — 1. L’oracle de Nemmereth'));
        $this->chapitre('Perle du Beshaar — 1. Sacrilège à Satarla');

        $this->patchJson("/api/bol/saga/{$saga->id}", ['titre' => 'perle du beshaar'])->assertStatus(422);
        $this->patchJson("/api/bol/saga/{$saga->id}", ['titre' => 'Le Dieu dévoilé'])->assertOk()->assertJsonPath('titre', 'Le Dieu dévoilé');

        $this->assertSame('Le Dieu dévoilé', $saga->fresh()->titre);
    }

    public function test_another_accounts_scenario_is_not_found(): void
    {
        $etranger = BolSaga::create(['user_id' => User::factory()->create()->id, 'titre' => 'Ailleurs']);

        $this->patchJson("/api/bol/saga/{$etranger->id}", ['titre' => 'Volé'])->assertNotFound();
        $this->assertSame('Ailleurs', $etranger->fresh()->titre);
    }

    public function test_deleting_a_scenario_takes_its_chapters_and_their_scenes(): void
    {
        $premier = $this->chapitre('Le Dieu voilé — 1. L’oracle de Nemmereth');
        $second = $this->chapitre('Le Dieu voilé — 2. Envolé le Corbeau !');
        $saga = $this->saga($premier);
        $this->postJson('/api/bol/scene/create', ['titre' => 'Une scène', 'scenario_id' => $second['id']])->assertOk();

        $this->deleteJson("/api/bol/saga/{$saga->id}")->assertOk();

        $this->assertNull(BolSaga::find($saga->id));
        $this->assertSame(0, BolScenario::whereIn('id', [$premier['id'], $second['id']])->count());
        $this->assertSame(0, BolScene::where('user_id', $this->user->id)->count());
    }

    public function test_a_scenario_that_a_partie_plays_is_not_deleted(): void
    {
        $chapitre = $this->chapitre('Le Dieu voilé — 1. L’oracle de Nemmereth');
        $saga = $this->saga($chapitre);
        BolFightSession::create(['titre' => 'Les Lames', 'statut' => 'libre', 'user_id' => $this->user->id, 'scenario_id' => $chapitre['id']]);

        $this->deleteJson("/api/bol/saga/{$saga->id}")->assertStatus(409);

        $this->assertNotNull(BolScenario::find($chapitre['id']));
    }

    public function test_the_home_page_counts_scenarios_and_one_shots(): void
    {
        $this->chapitre('Le Dieu voilé — 1. L’oracle de Nemmereth');
        $this->chapitre('Le Dieu voilé — 2. Envolé le Corbeau !');
        $this->chapitre('Premier scénario');

        $this->getJson('/api/bol/accueil')->assertOk()->assertJsonPath('comptes.scenarios', 2);
    }

    /** @return array<string, mixed> le chapitre créé par l'API, rangé dans son scénario d'après son titre */
    private function chapitre(string $titre): array
    {
        return $this->postJson('/api/bol/scenario/create', ['titre' => $titre])->assertOk()->json();
    }

    private function saga(array $chapitre): BolSaga
    {
        return BolSaga::findOrFail($chapitre['saga']['id']);
    }
}
