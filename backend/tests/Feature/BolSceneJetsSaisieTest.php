<?php

namespace Tests\Feature;

use App\Models\Bol\BolScene;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** « Préparer la scène » enregistre ses jets : une liste nettoyée ; un attribut de combat ou une difficulté inconnue sont refusés. */
class BolSceneJetsSaisieTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_la_scene_enregistre_ses_jets(): void
    {
        $scene = $this->scene();

        $reponse = $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'jets' => [
            ['titre' => ' Coquillage ', 'attributs' => ['vigueur'], 'difficulte' => 'ardue', 'enjeu' => 'dégager sa jambe', 'echec' => 'le pied reste pris'],
            ['titre' => 'Poissons volants', 'attributs' => [], 'echec' => 'd3 dégâts', 'quand' => ''],
        ]])->assertOk();

        $attendu = [
            ['titre' => 'Coquillage', 'attributs' => ['vigueur'], 'difficulte' => 'ardue', 'enjeu' => 'dégager sa jambe', 'echec' => 'le pied reste pris', 'reussite' => null, 'carriere' => null, 'quand' => null],
            ['titre' => 'Poissons volants', 'attributs' => [], 'difficulte' => 'moyenne', 'enjeu' => null, 'echec' => 'd3 dégâts', 'reussite' => null, 'carriere' => null, 'quand' => null],
        ];
        $this->assertSame($attendu, $scene->fresh()->jets);
        $this->assertSame($attendu, $reponse->json('jets'));
        $this->assertSame([['kind' => 'creature', 'source_id' => 'x', 'qty' => 1]], $scene->fresh()->distribution);
    }

    public function test_un_attribut_de_combat_est_refuse(): void
    {
        $scene = $this->scene();

        $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'jets' => [['titre' => 'Duel', 'attributs' => ['melee']]]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('jets.0.attributs.0');
    }

    public function test_une_difficulte_inconnue_est_refusee(): void
    {
        $scene = $this->scene();

        $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'jets' => [['titre' => 'Coquillage', 'difficulte' => 'ardu']]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('jets.0.difficulte');
    }

    public function test_trois_attributs_sont_refuses(): void
    {
        $scene = $this->scene();

        $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'jets' => [['titre' => 'Tout', 'attributs' => ['vigueur', 'agilite', 'esprit']]]])
            ->assertStatus(422)
            ->assertJsonValidationErrors('jets.0.attributs');
    }

    public function test_un_update_sans_jets_les_garde(): void
    {
        $jets = [['titre' => 'Coquillage', 'attributs' => ['vigueur'], 'difficulte' => 'ardue', 'enjeu' => null, 'echec' => null, 'reussite' => null, 'carriere' => null, 'quand' => null]];
        $scene = $this->scene(['jets' => $jets]);

        $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'titre' => 'La taverne du Puits sec'])->assertOk();

        $this->assertSame($jets, $scene->fresh()->jets);
    }

    public function test_des_jets_vides_sont_effaces(): void
    {
        $scene = $this->scene(['jets' => [['titre' => 'Coquillage', 'attributs' => [], 'difficulte' => 'moyenne']]]);

        $this->postJson('/api/bol/scene/update', ['id' => $scene->id, 'jets' => null])->assertOk();

        $this->assertNull($scene->fresh()->jets);
    }

    /** @param array<string, mixed> $avec */
    private function scene(array $avec = []): BolScene
    {
        return BolScene::create([
            'user_id'      => $this->user->id,
            'scenario_id'  => null,
            'titre'        => 'La taverne',
            'ordre'        => 0,
            'distribution' => [['kind' => 'creature', 'source_id' => 'x', 'qty' => 1]],
            ...$avec,
        ]);
    }
}
