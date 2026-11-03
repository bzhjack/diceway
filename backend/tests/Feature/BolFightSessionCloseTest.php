<?php

namespace Tests\Feature;

use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionHeros;
use App\Models\Bol\BolHeros;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Clore une table (statut `terminee`) : elle quitte l'accueil et reste dans « Mes sessions », d'où « Reprendre » la rouvre. */
class BolFightSessionCloseTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_closing_a_free_table_ends_it(): void
    {
        $table = $this->table('libre');

        $this->patchJson("/api/bol/fight-session/{$table->id}/close")->assertOk()->assertJsonPath('statut', 'terminee');

        $this->assertSame('terminee', $table->fresh()->statut);
    }

    public function test_closing_a_table_in_combat_ends_the_combat_first(): void
    {
        $table = $this->table('combat', ['ordre_manuel' => ['hero-1'], 'etat_combat' => ['round' => 3]]);
        $heros = BolHeros::create(['nom' => 'Héros', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'H']);
        $place = BolFightSessionHeros::create(['fight_session_id' => $table->id, 'heros_id' => $heros->id, 'camp' => 'heros', 'initiative_resultat' => 'reussite']);

        $this->patchJson("/api/bol/fight-session/{$table->id}/close")->assertOk()->assertJsonPath('statut', 'terminee');

        $table->refresh();
        $this->assertSame('terminee', $table->statut);
        $this->assertNull($table->etat_combat);
        $this->assertNull($table->ordre_manuel);
        $this->assertNull($place->fresh()->initiative_resultat);
    }

    public function test_a_closed_table_leaves_the_home_page_but_stays_in_the_sessions(): void
    {
        $table = $this->table('libre');

        $this->patchJson("/api/bol/fight-session/{$table->id}/close")->assertOk();

        $this->assertNull($this->getJson('/api/bol/accueil')->assertOk()->json('table'));
        $this->assertSame([$table->id], array_column($this->getJson('/api/bol/fight-session')->assertOk()->json(), 'id'));
    }

    public function test_reopening_a_closed_table_makes_it_free_again(): void
    {
        $table = $this->table('terminee');

        $this->patchJson("/api/bol/fight-session/{$table->id}/reopen")->assertOk()->assertJsonPath('statut', 'libre');

        $this->assertSame('libre', $table->fresh()->statut);
        $this->assertSame($table->id, $this->getJson('/api/bol/accueil')->json('table.id'));
    }

    public function test_reopening_leaves_a_table_in_combat_in_combat(): void
    {
        $table = $this->table('combat', ['etat_combat' => ['round' => 2]]);

        $this->patchJson("/api/bol/fight-session/{$table->id}/reopen")->assertOk()->assertJsonPath('statut', 'combat');

        $this->assertSame(['round' => 2], $table->fresh()->etat_combat);
    }

    public function test_another_accounts_table_answers_404(): void
    {
        $other = User::factory()->create();
        $ouverte = $this->table('combat', [], $other);
        $close = $this->table('terminee', [], $other);

        $this->patchJson("/api/bol/fight-session/{$ouverte->id}/close")->assertNotFound();
        $this->patchJson("/api/bol/fight-session/{$close->id}/reopen")->assertNotFound();

        $this->assertSame('combat', $ouverte->fresh()->statut);
        $this->assertSame('terminee', $close->fresh()->statut);
    }

    private function table(string $statut, array $over = [], ?User $owner = null): BolFightSession
    {
        return BolFightSession::create(['titre' => 'Table', 'statut' => $statut, 'user_id' => ($owner ?? $this->user)->id] + $over);
    }
}
