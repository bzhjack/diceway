<?php

namespace Tests\Feature;

use App\Models\Bol\BolCompagnie;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionHeros;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolSaga;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScene;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Une compagnie est un nom et des héros ; une partie l'associe à un scénario, et elle peut en jouer plusieurs. */
class BolCompagnieTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_creates_a_company_with_its_heroes_in_order(): void
    {
        $axel = $this->hero('Axel');
        $balaram = $this->hero('Balaram');
        $balaram->update(['avatar' => '/assets/bol/empty-avatar.jpg']);

        $response = $this->postJson('/api/bol/compagnie/create', ['nom' => '  Les Lames  ', 'heros' => [$balaram->id, $axel->id]])->assertOk();

        $response->assertJsonPath('nom', 'Les Lames');
        $this->assertSame([
            ['id' => $balaram->id, 'nom' => 'Balaram', 'avatar' => '/assets/bol/empty-avatar.jpg'],
            ['id' => $axel->id, 'nom' => 'Axel', 'avatar' => null],
        ], $response->json('heros'));
        $this->assertSame(0, $response->json('parties'));
        $this->assertSame($this->user->id, BolCompagnie::find($response->json('id'))->user_id);
    }

    public function test_a_company_needs_a_name_and_a_hero(): void
    {
        $axel = $this->hero('Axel');

        foreach ([['heros' => [$axel->id]], ['nom' => '   ', 'heros' => [$axel->id]], ['nom' => str_repeat('a', 256), 'heros' => [$axel->id]]] as $payload) {
            $this->postJson('/api/bol/compagnie/create', $payload)->assertUnprocessable()->assertJsonValidationErrors('nom');
        }
        foreach ([['nom' => 'Vide'], ['nom' => 'Vide', 'heros' => []]] as $payload) {
            $this->postJson('/api/bol/compagnie/create', $payload)->assertUnprocessable()->assertJsonValidationErrors('heros');
        }
        $this->assertSame(0, BolCompagnie::count());
    }

    /** Seuls les héros du compte y entrent : ni un PNJ, ni le héros d'un autre compte. Sans aucun héros valable, pas de compagnie. */
    public function test_a_company_only_takes_the_accounts_own_heroes(): void
    {
        $axel = $this->hero('Axel');
        $pnj = $this->hero('Allié', 'C');
        $etranger = $this->hero('Étranger', 'H', User::factory()->create());

        $response = $this->postJson('/api/bol/compagnie/create', ['nom' => 'Les Lames', 'heros' => [$pnj->id, $etranger->id, $axel->id]])->assertOk();
        $this->assertSame([$axel->id], array_column($response->json('heros'), 'id'));

        $this->postJson('/api/bol/compagnie/create', ['nom' => 'Personne', 'heros' => [$pnj->id, $etranger->id]])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('heros');
    }

    public function test_lists_only_own_companies_with_their_parties_count(): void
    {
        $mienne = $this->compagnie('Les Lames', [$this->hero('Axel')]);
        $this->compagnie('Ailleurs', [], User::factory()->create());
        [$ch1] = $this->saga('Perle du Beshaar', 1);
        $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $mienne->id, 'scenario_id' => $ch1->id])->assertOk();

        $liste = $this->getJson('/api/bol/compagnie')->assertOk()->json();

        $this->assertSame([$mienne->id], array_column($liste, 'id'));
        $this->assertSame(1, $liste[0]['parties']);
    }

    /** Une compagnie modifiée vaut pour les prochaines parties : celles déjà commencées gardent leurs héros, mais suivent son nom. */
    public function test_updating_a_company_only_changes_its_next_parties(): void
    {
        $axel = $this->hero('Axel');
        $balaram = $this->hero('Balaram');
        $compagnie = $this->compagnie('Les Lames', [$axel]);
        [$ch1] = $this->saga('Perle du Beshaar', 1);
        [$dv1] = $this->saga('Le Dieu voilé', 1);
        $avant = $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $compagnie->id, 'scenario_id' => $ch1->id])->assertOk()->json('id');

        $this->postJson('/api/bol/compagnie/update', ['id' => $compagnie->id, 'nom' => 'Les Fils', 'heros' => [$balaram->id]])
            ->assertOk()
            ->assertJsonPath('nom', 'Les Fils');

        $this->assertSame('Les Fils', BolFightSession::find($avant)->titre);
        $this->assertSame([$axel->id], $this->herosDe($avant));
        $apres = $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $compagnie->id, 'scenario_id' => $dv1->id])->assertOk()->json('id');
        $this->assertSame([$balaram->id], $this->herosDe($apres));
    }

    public function test_cannot_read_or_change_the_company_of_another_account(): void
    {
        $etrangere = $this->compagnie('Ailleurs', [], User::factory()->create());
        $axel = $this->hero('Axel');

        $this->postJson('/api/bol/compagnie/update', ['id' => $etrangere->id, 'nom' => 'Volée', 'heros' => [$axel->id]])->assertNotFound();
        $this->deleteJson("/api/bol/compagnie/delete/{$etrangere->id}")->assertNotFound();
        $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $etrangere->id])->assertNotFound();

        $this->assertSame('Ailleurs', $etrangere->fresh()->nom);
    }

    /** Ses parties passent avant : on ne supprime pas une compagnie qui en a encore. */
    public function test_deleting_a_company_is_refused_while_it_has_parties(): void
    {
        $compagnie = $this->compagnie('Les Lames', [$this->hero('Axel')]);
        $partie = $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $compagnie->id])->assertOk()->json('id');

        $this->deleteJson("/api/bol/compagnie/delete/{$compagnie->id}")->assertUnprocessable();
        $this->assertNotNull($compagnie->fresh());

        $this->deleteJson("/api/bol/fight-session/delete/{$partie}")->assertOk();
        $this->deleteJson("/api/bol/compagnie/delete/{$compagnie->id}")->assertOk();
        $this->assertNull($compagnie->fresh());
    }

    /** Une partie prend le nom et les héros de sa compagnie, et part sur le chapitre demandé. */
    public function test_a_partie_takes_the_name_and_heroes_of_its_company(): void
    {
        $axel = $this->hero('Axel');
        $compagnie = $this->compagnie('Les Lames', [$axel]);
        [$ch1] = $this->saga('Perle du Beshaar', 1);

        $partie = $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $compagnie->id, 'scenario_id' => $ch1->id])->assertOk();

        $partie->assertJsonPath('titre', 'Les Lames')->assertJsonPath('compagnie_id', $compagnie->id)->assertJsonPath('scenario_id', $ch1->id);
        $this->assertSame([$axel->id], $this->herosDe($partie->json('id')));
    }

    /** Une compagnie joue plusieurs scénarios ; deux compagnies, le même ; mais une compagnie ne joue pas deux fois le même scénario. */
    public function test_a_company_plays_several_scenarios_but_each_only_once(): void
    {
        $lames = $this->compagnie('Les Lames', [$this->hero('Axel')]);
        $fils = $this->compagnie('Les Fils', [$this->hero('Balaram')]);
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        [$dv1] = $this->saga('Le Dieu voilé', 1);
        $premiere = $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $lames->id, 'scenario_id' => $ch1->id])->assertOk()->json('id');

        $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $lames->id, 'scenario_id' => $dv1->id])->assertOk();
        $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $fils->id, 'scenario_id' => $ch1->id])->assertOk();

        // Un autre chapitre du même scénario, c'est le même scénario : on reprend la partie.
        $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $lames->id, 'scenario_id' => $ch2->id])
            ->assertUnprocessable()
            ->assertJsonPath('partie_id', $premiere);
    }

    /** Sans scénario, rien n'empêche une compagnie d'improviser plusieurs fois ; un one shot est un scénario. */
    public function test_a_company_may_improvise_several_times_but_plays_a_one_shot_once(): void
    {
        $lames = $this->compagnie('Les Lames', [$this->hero('Axel')]);
        $oneShot = BolScenario::create(['user_id' => $this->user->id, 'titre' => 'Un ennui mortel']);

        $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $lames->id])->assertOk();
        $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $lames->id])->assertOk();
        $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $lames->id, 'scenario_id' => $oneShot->id])->assertOk();
        $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $lames->id, 'scenario_id' => $oneShot->id])->assertUnprocessable();
    }

    /** Une partie improvisée ne prend pas un scénario que sa compagnie joue déjà : ni par son menu, ni en chargeant une de ses scènes. */
    public function test_an_improvised_partie_cannot_join_a_scenario_its_company_already_plays(): void
    {
        $lames = $this->compagnie('Les Lames', [$this->hero('Axel')]);
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $lames->id, 'scenario_id' => $ch1->id])->assertOk();
        $improvisee = $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $lames->id])->assertOk()->json('id');

        $this->patchJson("/api/bol/fight-session/{$improvisee}/scenario", ['scenario_id' => $ch2->id])->assertUnprocessable();
        $scene = BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $ch2->id, 'titre' => 'Scène', 'ordre' => 0, 'distribution' => []]);
        $this->postJson("/api/bol/fight-session/{$improvisee}/load-scene", ['scene_id' => $scene->id, 'mode' => 'add'])->assertOk();

        $this->assertNull(BolFightSession::find($improvisee)->scenario_id);
    }

    /** L'accueil donne les compagnies et, sur chaque partie, sa compagnie. */
    public function test_the_home_page_lists_companies_and_links_parties_to_them(): void
    {
        $axel = $this->hero('Axel');
        $compagnie = $this->compagnie('Les Lames', [$axel]);
        $partie = $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $compagnie->id])->assertOk()->json('id');
        $this->compagnie('Ailleurs', [], User::factory()->create());

        $accueil = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertSame([[
            'id' => $compagnie->id,
            'nom' => 'Les Lames',
            'heros' => [['id' => $axel->id, 'nom' => 'Axel', 'avatar' => null]],
            'parties' => 1,
        ]], $accueil->json('compagnies'));
        $this->assertSame($compagnie->id, collect($accueil->json('parties'))->firstWhere('id', $partie)['compagnie_id']);
        $this->assertSame(1, $accueil->json('comptes.compagnies'));
    }

    /** Les tables d'avant deviennent des parties : une compagnie par nom et par compte, avec les héros de ses tables, les parties reliées. */
    public function test_the_migration_files_existing_tables_under_companies(): void
    {
        $axel = $this->hero('Axel');
        $balaram = $this->hero('Balaram');
        $autre = User::factory()->create();
        $migration = require database_path('migrations/2026_11_04_170000_create_bol_compagnie.php');
        $migration->down();
        $a = $this->tableAncienne('Les Lames', $this->user, [$axel]);
        $this->travel(1)->minutes();
        $b = $this->tableAncienne('les lames ', $this->user, [$balaram, $axel]);
        $c = $this->tableAncienne('Les Lames', $autre, []);
        $d = $this->tableAncienne(null, $this->user, [$balaram]);

        $migration->up();

        $lames = BolCompagnie::where('user_id', $this->user->id)->where('nom', 'Les Lames')->sole();
        $this->assertSame([$axel->id, $balaram->id], $lames->heros()->pluck('bol_heros.id')->all());
        $this->assertSame($lames->id, DB::table('bol_fight_session')->where('id', $a)->value('compagnie_id'));
        $this->assertSame($lames->id, DB::table('bol_fight_session')->where('id', $b)->value('compagnie_id'));
        $this->assertSame(BolCompagnie::where('user_id', $autre->id)->sole()->id, DB::table('bol_fight_session')->where('id', $c)->value('compagnie_id'));
        $sansNom = BolCompagnie::where('user_id', $this->user->id)->where('nom', 'Compagnie sans nom')->sole();
        $this->assertSame($sansNom->id, DB::table('bol_fight_session')->where('id', $d)->value('compagnie_id'));
        $this->assertSame('Compagnie sans nom', DB::table('bol_fight_session')->where('id', $d)->value('titre'));
    }

    /** @return array<int, string> les héros assis à une table, dans l'ordre */
    private function herosDe(string $partie): array
    {
        return BolFightSessionHeros::where('fight_session_id', $partie)->orderBy('id')->pluck('heros_id')->all();
    }

    /** @param array<int, BolHeros> $heros */
    private function tableAncienne(?string $titre, User $user, array $heros): string
    {
        $session = BolFightSession::create(['titre' => $titre, 'statut' => 'libre', 'user_id' => $user->id, 'jouee_le' => now()]);
        foreach ($heros as $h) {
            BolFightSessionHeros::create(['fight_session_id' => $session->id, 'heros_id' => $h->id, 'camp' => 'heros']);
        }

        return $session->id;
    }

    /** @param array<int, BolHeros> $heros */
    private function compagnie(string $nom, array $heros, ?User $owner = null): BolCompagnie
    {
        $compagnie = BolCompagnie::create(['nom' => $nom, 'user_id' => ($owner ?? $this->user)->id]);
        $compagnie->heros()->sync(array_map(fn (BolHeros $h) => $h->id, $heros));

        return $compagnie;
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

    private function hero(string $nom, string $type = 'H', ?User $owner = null): BolHeros
    {
        return BolHeros::create(['nom' => $nom, 'joueur' => 'J', 'user_id' => ($owner ?? $this->user)->id, 'type' => $type]);
    }
}
