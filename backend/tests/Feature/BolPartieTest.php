<?php

namespace Tests\Feature;

use App\Models\Bol\BolFightSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Une partie se joue quand on veut, sans en clore une autre : entrer à la table la marque jouée, rien de plus. */
class BolPartieTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_creating_a_table_marks_it_played_now(): void
    {
        $this->freezeSecond();

        $id = $this->postJson('/api/bol/fight-session/create', ['titre' => 'Les Lames'])->assertOk()->json('id');

        $this->assertTrue(BolFightSession::find($id)->jouee_le->equalTo(now()));
    }

    public function test_jouer_marks_the_table_played_and_leaves_the_others(): void
    {
        $autre = $this->partie('combat');
        $this->travel(1)->minutes();
        $partie = $this->partie('libre');
        $avant = $autre->fresh()->jouee_le;
        $this->travel(1)->minutes();

        $this->patchJson("/api/bol/fight-session/{$partie->id}/jouer")->assertOk()->assertJsonPath('id', $partie->id);

        $this->assertTrue($partie->fresh()->jouee_le->equalTo(now()->startOfSecond()));
        $this->assertSame('combat', $autre->fresh()->statut);
        $this->assertTrue($autre->fresh()->jouee_le->equalTo($avant));
    }

    public function test_jouer_answers_404_for_another_account(): void
    {
        $etrangere = BolFightSession::create(['titre' => 'Ailleurs', 'statut' => 'libre', 'user_id' => User::factory()->create()->id]);

        $this->patchJson("/api/bol/fight-session/{$etrangere->id}/jouer")->assertNotFound();
    }

    public function test_close_and_reopen_routes_are_gone(): void
    {
        $partie = $this->partie('libre');

        $this->patchJson("/api/bol/fight-session/{$partie->id}/close")->assertNotFound();
        $this->patchJson("/api/bol/fight-session/{$partie->id}/reopen")->assertNotFound();
        $this->assertSame('libre', $partie->fresh()->statut);
    }

    /** Les tables closes d'avant redeviennent des parties qu'on reprend, datées de leur dernière activité, et leur clôture ne vaut plus chapitre joué. */
    public function test_the_migration_turns_closed_tables_into_parties(): void
    {
        $migration = require database_path('migrations/2026_11_04_100000_parties_on_bol_fight_session.php');
        $migration->down();
        $id = '11111111-1111-1111-1111-111111111111';
        DB::table('bol_fight_session')->insert(['id' => $id, 'titre' => 'Ancienne', 'statut' => 'terminee', 'chapitres_quittes' => json_encode(['c1']), 'user_id' => $this->user->id, 'created_at' => '2026-01-01 10:00:00', 'updated_at' => '2026-02-02 20:00:00']);

        $migration->up();

        $partie = BolFightSession::find($id);
        $this->assertSame('libre', $partie->statut);
        $this->assertSame('2026-02-02 20:00:00', $partie->jouee_le->format('Y-m-d H:i:s'));
        $this->assertNull($partie->chapitres_quittes);
    }

    private function partie(string $statut): BolFightSession
    {
        return BolFightSession::create(['titre' => 'Partie', 'statut' => $statut, 'user_id' => $this->user->id, 'jouee_le' => now()]);
    }
}
