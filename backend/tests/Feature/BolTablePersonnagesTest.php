<?php

namespace Tests\Feature;

use App\Models\Bol\BolCreature;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionCreature;
use App\Models\Bol\BolFightSessionHeros;
use App\Models\Bol\BolFightSessionPnj;
use App\Models\Bol\BolHeros;
use App\Models\User;
use Database\Seeders\BolTailleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** « Ajouter des personnages » à la table : le casting de « Préparer la scène » pose sa distribution (nombre, camp, attitude) à côté de ce qui y est. */
class BolTablePersonnagesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
        (new BolTailleSeeder())->run();
    }

    public function test_seats_each_copy_with_its_camp_and_attitude_next_to_what_is_on_the_table(): void
    {
        $garde = $this->pnj('Garde');
        $guide = $this->pnj('Guide');
        $loup = BolCreature::create(['nom' => 'Loup', 'user_id' => $this->user->id, 'id_taille' => 4, 'vitalite' => 5]);
        $session = $this->table();
        $this->postJson("/api/bol/fight-session/{$session->id}/combatant", ['kind' => 'pnj', 'sourceId' => $garde->id, 'camp' => 'adversaires'])->assertOk();

        $response = $this->postJson("/api/bol/fight-session/{$session->id}/personnages", ['distribution' => [
            ['kind' => 'pnj', 'source_id' => $garde->id, 'qty' => 2, 'camp' => 'adversaires', 'attitude' => 'mefiant'],
            ['kind' => 'creature', 'source_id' => $loup->id, 'qty' => 3, 'camp' => 'adversaires', 'attitude' => 'hostile'],
            ['kind' => 'pnj', 'source_id' => $guide->id, 'qty' => 1, 'camp' => 'heros', 'attitude' => 'amical'],
        ]])->assertOk();

        $this->assertSame(0, $response->json('ignored'));
        $this->assertSame($session->id, $response->json('session.id'));
        $pnjs = BolFightSessionPnj::where('fight_session_id', $session->id)->orderBy('id')->get();
        $this->assertSame([$garde->id, $garde->id, $garde->id, $guide->id], $pnjs->pluck('pnj_id')->all());
        $this->assertSame([null, 'mefiant', 'mefiant', 'amical'], $pnjs->pluck('attitude')->all());
        $this->assertSame(['adversaires', 'adversaires', 'adversaires', 'heros'], $pnjs->pluck('camp')->all());
        $loups = BolFightSessionCreature::where('fight_session_id', $session->id)->get();
        $this->assertCount(3, $loups);
        $this->assertSame(['hostile'], $loups->pluck('attitude')->unique()->values()->all());
    }

    public function test_ignores_a_sheet_of_another_account(): void
    {
        $etranger = BolHeros::create(['nom' => 'Étranger', 'joueur' => 'J', 'user_id' => User::factory()->create()->id, 'type' => 'C']);
        $session = $this->table();

        $this->postJson("/api/bol/fight-session/{$session->id}/personnages", ['distribution' => [
            ['kind' => 'pnj', 'source_id' => $etranger->id, 'qty' => 1, 'camp' => 'adversaires'],
        ]])->assertOk();

        $this->assertSame(0, BolFightSessionPnj::where('fight_session_id', $session->id)->count());
    }

    public function test_seats_them_during_a_combat_too(): void
    {
        $garde = $this->pnj('Garde');
        $session = $this->table('combat');

        $this->postJson("/api/bol/fight-session/{$session->id}/personnages", ['distribution' => [
            ['kind' => 'pnj', 'source_id' => $garde->id, 'qty' => 2, 'camp' => 'adversaires', 'attitude' => 'hostile'],
        ]])->assertOk()->assertJsonPath('ignored', 0);

        $this->assertSame(2, BolFightSessionPnj::where('fight_session_id', $session->id)->where('attitude', 'hostile')->count());
        $this->assertSame('combat', $session->fresh()->statut);
    }

    public function test_seats_a_hero_of_the_account_once_with_full_vitality(): void
    {
        $kaja = BolHeros::create(['nom' => 'Kaja', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'H', 'active' => true, 'vitalite' => 11]);
        $session = $this->table('combat');
        $saisie = ['distribution' => [['kind' => 'hero', 'source_id' => $kaja->id, 'qty' => 3, 'camp' => 'adversaires', 'attitude' => 'hostile']]];

        $this->postJson("/api/bol/fight-session/{$session->id}/personnages", $saisie)->assertOk()->assertJsonPath('ignored', 0);
        $this->postJson("/api/bol/fight-session/{$session->id}/personnages", $saisie)->assertOk();

        $lignes = BolFightSessionHeros::where('fight_session_id', $session->id)->get();
        $this->assertCount(1, $lignes);
        $this->assertSame('heros', $lignes[0]->camp);
        $this->assertSame(11, (int) $lignes[0]->vitalite_courante);
        $this->assertNull($lignes[0]->initiative_resultat);
    }

    public function test_ignores_a_hero_of_another_account_or_in_creation(): void
    {
        $etranger = BolHeros::create(['nom' => 'Étranger', 'joueur' => 'J', 'user_id' => User::factory()->create()->id, 'type' => 'H', 'active' => true]);
        $enCours = BolHeros::create(['nom' => 'En cours', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'H', 'active' => false]);
        $session = $this->table();

        $this->postJson("/api/bol/fight-session/{$session->id}/personnages", ['distribution' => [
            ['kind' => 'hero', 'source_id' => $etranger->id, 'qty' => 1, 'camp' => 'heros'],
            ['kind' => 'hero', 'source_id' => $enCours->id, 'qty' => 1, 'camp' => 'heros'],
        ]])->assertOk();

        $this->assertSame(0, BolFightSessionHeros::where('fight_session_id', $session->id)->count());
    }

    public function test_the_table_of_another_account_answers_404(): void
    {
        $garde = $this->pnj('Garde');
        $autre = BolFightSession::create(['titre' => 'Autre', 'statut' => 'libre', 'user_id' => User::factory()->create()->id]);

        $this->postJson("/api/bol/fight-session/{$autre->id}/personnages", ['distribution' => [
            ['kind' => 'pnj', 'source_id' => $garde->id, 'qty' => 1, 'camp' => 'adversaires'],
        ]])->assertNotFound();
    }

    private function pnj(string $nom): BolHeros
    {
        return BolHeros::create(['nom' => $nom, 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'C']);
    }

    private function table(string $statut = 'libre'): BolFightSession
    {
        return BolFightSession::create(['titre' => 'Table', 'statut' => $statut, 'user_id' => $this->user->id]);
    }
}
