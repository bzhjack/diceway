<?php

namespace Tests\Feature;

use App\Models\Bol\BolCreature;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolHeros;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** La liste des sessions sert l'accueil et la bibliothèque : légère, sans table ni portraits. */
class BolFightSessionListTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_lists_the_sessions_of_the_account_most_recent_first(): void
    {
        $older = $this->tableSession('Ancienne');
        $this->travel(1)->minutes();
        $newer = $this->tableSession('Récente', 'combat');
        BolFightSession::create(['titre' => 'Autre compte', 'statut' => 'libre', 'user_id' => User::factory()->create()->id]);

        $response = $this->getJson('/api/bol/fight-session')->assertOk();

        $this->assertSame([$newer->id, $older->id], array_column($response->json(), 'id'));
        $this->assertSame(['combat', 'libre'], array_column($response->json(), 'statut'));
    }

    public function test_counts_each_camp_without_sending_the_table(): void
    {
        $session = $this->tableSession('Table');
        $hero = BolHeros::create(['nom' => 'Héros', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'H', 'avatar' => 'data:image/png;base64,PORTRAIT']);
        $pnj = BolHeros::create(['nom' => 'Allié', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'C']);
        DB::table('bol_taille')->insert(['taille' => 'Moyenne', 'type' => 'C']);
        $creature = BolCreature::create(['nom' => 'Bête', 'user_id' => $this->user->id, 'id_taille' => DB::table('bol_taille')->value('id')]);

        $this->add($session, 'hero', $hero->id, 'heros');
        $this->add($session, 'pnj', $pnj->id, 'heros');
        $this->add($session, 'creature', $creature->id, 'adversaires', 2);

        $response = $this->getJson('/api/bol/fight-session')->assertOk();

        $this->assertSame([[
            'id' => $session->id,
            'titre' => 'Table',
            'statut' => 'libre',
            'heros_count' => 2,
            'adversaires_count' => 2,
        ]], $response->json());
        $this->assertStringNotContainsString('PORTRAIT', $response->getContent());
    }

    private function tableSession(string $titre, string $statut = 'libre'): BolFightSession
    {
        return BolFightSession::create(['titre' => $titre, 'statut' => $statut, 'user_id' => $this->user->id]);
    }

    private function add(BolFightSession $session, string $kind, string $sourceId, string $camp, int $qty = 1): void
    {
        $this->postJson("/api/bol/fight-session/{$session->id}/combatant", ['kind' => $kind, 'sourceId' => $sourceId, 'camp' => $camp, 'qty' => $qty])->assertOk();
    }
}
