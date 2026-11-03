<?php

namespace Tests\Feature;

use App\Models\Bol\BolArme;
use App\Models\Bol\BolArmure;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionHeros;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScene;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** L'accueil lit en une requête légère la table ouverte, les scénarios, leur avancement et les derniers héros à table. */
class BolAccueilTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_without_open_table(): void
    {
        $this->tableSession('terminee');

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertNull($response->json('table'));
    }

    public function test_open_table_is_the_most_recent_libre_or_combat(): void
    {
        $this->tableSession('libre');
        $this->travel(1)->minutes();
        $combat = $this->tableSession('combat');
        $this->travel(1)->minutes();
        $this->tableSession('terminee');

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertSame($combat->id, $response->json('table.id'));
        $this->assertNotEmpty($response->json('table.created_at'));
    }

    public function test_a_reopened_table_comes_back_as_the_open_table(): void
    {
        $ancienne = $this->tableSession('terminee');
        $this->travel(1)->minutes();
        $recente = $this->tableSession('libre');
        $this->travel(1)->minutes();

        $this->patchJson("/api/bol/fight-session/{$ancienne->id}/reopen")->assertOk();

        // Rouvrir touche la table : c'est la plus récemment active, même créée avant l'autre.
        $this->assertTrue($ancienne->fresh()->updated_at->greaterThan($recente->fresh()->updated_at));
        $this->assertSame($ancienne->id, $this->getJson('/api/bol/accueil')->assertOk()->json('table.id'));
    }

    public function test_a_table_closed_last_does_not_come_back_as_the_open_table(): void
    {
        $ouverte = $this->tableSession('libre');
        $this->travel(1)->minutes();
        $close = $this->tableSession('libre');
        $this->travel(1)->minutes();

        $this->patchJson("/api/bol/fight-session/{$close->id}/close")->assertOk();

        $this->assertSame($ouverte->id, $this->getJson('/api/bol/accueil')->assertOk()->json('table.id'));
    }

    public function test_describes_the_open_table(): void
    {
        $scenario = $this->scenario('Le Dieu voilé — Introduction');
        $session = $this->tableSession('libre', $scenario->id);

        $table = $this->getJson('/api/bol/accueil')->assertOk()->json('table');

        $this->assertSame(['id', 'titre', 'statut', 'scenario_id', 'created_at'], array_keys($table));
        $this->assertSame($session->id, $table['id']);
        $this->assertSame('Table', $table['titre']);
        $this->assertSame('libre', $table['statut']);
        $this->assertSame($scenario->id, $table['scenario_id']);
        $this->assertSame($session->created_at->toIso8601String(), $table['created_at']);
    }

    public function test_lists_only_own_scenarios(): void
    {
        $a = $this->scenario('Perle du Beshaar — 1. Sacrilège');
        $b = $this->scenario('Le Dieu voilé — Introduction');
        $this->scenario('Étranger', User::factory()->create());

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $scenarios = $response->json('scenarios');
        $this->assertEqualsCanonicalizing([$a->id, $b->id], array_column($scenarios, 'id'));
        $this->assertSame(['id', 'titre'], array_keys($scenarios[0]));
    }

    public function test_played_scenarios_come_from_every_session(): void
    {
        $a = $this->scenario('A');
        $b = $this->scenario('B');
        $c = $this->scenario('C', $other = User::factory()->create());
        $s1 = $this->scene($a->id);
        $s2 = $this->scene($b->id);
        $s3 = $this->scene(null);
        $foreignScene = $this->scene($c->id, $other);

        $this->tableSession('terminee', null, [$s1->id, $s3->id]);
        $this->tableSession('libre', null, [$s2->id]);
        BolFightSession::create(['titre' => 'Autre compte', 'statut' => 'libre', 'user_id' => $other->id, 'scenes_jouees' => [$foreignScene->id]]);

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $joues = $response->json('scenarios_joues');
        $this->assertEqualsCanonicalizing([$a->id, $b->id], $joues);
        $this->assertSame(array_values($joues), $joues);
    }

    public function test_a_chapter_played_without_loading_a_scene_counts_as_played(): void
    {
        $ancien = $this->scenario('Saga — 1. Ancien');
        $ferme = $this->scenario('Saga — 2. Fermé');
        $ouvert = $this->scenario('Saga — 3. Ouvert');
        $etranger = $this->scenario('Étranger', $other = User::factory()->create());

        $this->tableSession('libre', $ancien->id);
        $this->travel(1)->minutes();
        $this->tableSession('terminee', $ferme->id);
        $this->travel(1)->minutes();
        $this->tableSession('libre', $ouvert->id);
        BolFightSession::create(['titre' => 'Autre compte', 'statut' => 'terminee', 'user_id' => $other->id, 'scenario_id' => $etranger->id]);

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        // La table ouverte est « sur la table ce soir », pas encore jouée ; les autres tables du compte l'ont été.
        $this->assertEqualsCanonicalizing([$ancien->id, $ferme->id], $response->json('scenarios_joues'));
    }

    public function test_no_played_scenario_is_an_empty_list(): void
    {
        $this->tableSession('libre');

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertSame([], $response->json('scenarios_joues'));
        $this->assertSame([], $response->json('derniers_heros'));
        $this->assertNull($response->json('scenario_recent_id'));
    }

    public function test_recent_scenario_is_the_last_touched_table(): void
    {
        $a = $this->scenario('A');
        $b = $this->scenario('B');
        $x = $this->tableSession('libre', $a->id);
        $this->travel(1)->minutes();
        $this->tableSession('libre', $b->id);
        $this->travel(1)->minutes();
        $x->update(['titre' => 'Table reprise']);
        $this->travel(1)->minutes();
        $this->tableSession('libre');

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertSame($a->id, $response->json('scenario_recent_id'));
    }

    public function test_last_heroes_are_the_heroes_of_the_newest_session(): void
    {
        $h1 = $this->hero('H1');
        $h2 = $this->hero('H2');
        $h3 = $this->hero('H3');
        $pnj = $this->hero('Allié', 'C');
        $foreign = $this->hero('Étranger', 'H', User::factory()->create());

        $old = $this->tableSession('terminee');
        $this->seat($old, $h1);
        $this->travel(1)->minutes();
        $new = $this->tableSession('libre');
        $this->seat($new, $h2);
        $this->seat($new, $pnj);
        $this->seat($new, $foreign);
        $this->seat($new, $h3);

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertSame([$h2->id, $h3->id], $response->json('derniers_heros'));
    }

    /** Le seuil ne liste que les héros du compte, du camp des héros : les autres seraient comptés sans qu'on puisse les voir. */
    public function test_last_heroes_are_the_accounts_own_heroes_on_the_heroes_side(): void
    {
        $own = $this->hero('Le mien');
        $rival = $this->hero('Rival');
        $catalog = BolHeros::create(['nom' => 'Catalogue', 'joueur' => 'J', 'user_id' => null, 'type' => 'H']);
        $foreign = $this->hero('Étranger', 'H', User::factory()->create());

        $table = $this->tableSession('libre');
        $this->seat($table, $catalog);
        $this->seat($table, $own);
        $this->seat($table, $foreign);
        $this->seat($table, $rival, 'adversaires');

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertSame([$own->id], $response->json('derniers_heros'));
    }

    public function test_company_names_the_last_heroes_in_their_order_with_their_portrait(): void
    {
        $h1 = $this->hero('Axel');
        $h2 = $this->hero('Balaram');
        $h2->update(['avatar' => '/assets/bol/empty-avatar.jpg']);

        $table = $this->tableSession('libre');
        $this->seat($table, $h2);
        $this->seat($table, $h1);

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertSame([
            ['id' => $h2->id, 'nom' => 'Balaram', 'avatar' => '/assets/bol/empty-avatar.jpg'],
            ['id' => $h1->id, 'nom' => 'Axel', 'avatar' => null],
        ], $response->json('compagnie'));
    }

    public function test_counts_what_each_library_shows_to_the_account(): void
    {
        // Les migrations posent déjà quelques fiches au catalogue (armes régionales…) : on compte ce que le test ajoute.
        $avant = $this->getJson('/api/bol/accueil')->assertOk()->json('comptes');
        $other = User::factory()->create();
        $taille = DB::table('bol_taille')->insertGetId(['taille' => 'Moyenne', 'type' => 'C']);
        $categorie = DB::table('bol_categorie')->insertGetId(['categorie' => 'Mineur', 'type' => 'C']);
        $this->hero('Héros');
        BolHeros::create(['nom' => 'Héros du catalogue', 'joueur' => 'J', 'user_id' => null, 'type' => 'H']);
        $this->hero('PNJ', 'C');
        BolHeros::create(['nom' => 'PNJ du catalogue', 'joueur' => 'J', 'user_id' => null, 'type' => 'C']);
        $this->hero('PNJ étranger', 'C', $other);
        foreach ([$this->user->id, null, $other->id] as $owner) {
            BolCreature::create(['nom' => 'Bête', 'user_id' => $owner, 'id_taille' => $taille]);
            BolDemon::create(['nom' => 'Démon', 'user_id' => $owner, 'id_categorie' => $categorie]);
            BolArme::create(['arme' => 'Lame ' . $owner, 'type' => 'M', 'degats' => 'd6', 'user_id' => $owner]);
            BolArmure::create(['armure' => 'Cuir ' . $owner, 'protection' => '1', 'user_id' => $owner]);
        }
        $this->tableSession('terminee');
        BolFightSession::create(['titre' => 'Autre', 'statut' => 'libre', 'user_id' => $other->id]);

        $apres = $this->getJson('/api/bol/accueil')->assertOk()->json('comptes');
        $ajoutes = array_map(fn (string $cle) => $apres[$cle] - $avant[$cle], array_combine(array_keys($apres), array_keys($apres)));

        $this->assertSame(['heros' => 1, 'pnjs' => 2, 'creatures' => 2, 'demons' => 2, 'armes' => 2, 'armures' => 2, 'sessions' => 1], $ajoutes);
    }

    public function test_hides_other_accounts(): void
    {
        $other = User::factory()->create();
        $scenario = $this->scenario('Étranger', $other);
        $scene = $this->scene($scenario->id, $other);
        $session = BolFightSession::create(['titre' => 'Autre compte', 'statut' => 'combat', 'user_id' => $other->id, 'scenario_id' => $scenario->id, 'scenes_jouees' => [$scene->id]]);
        $this->seat($session, $this->hero('Étranger', 'H', $other));

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertNull($response->json('table'));
        $this->assertSame([], $response->json('scenarios'));
        $this->assertSame([], $response->json('scenarios_joues'));
        $this->assertNull($response->json('scenario_recent_id'));
        $this->assertSame([], $response->json('derniers_heros'));
    }

    private function scenario(string $titre, ?User $owner = null): BolScenario
    {
        return BolScenario::create(['user_id' => ($owner ?? $this->user)->id, 'titre' => $titre]);
    }

    private function scene(?string $scenarioId, ?User $owner = null): BolScene
    {
        return BolScene::create(['user_id' => ($owner ?? $this->user)->id, 'scenario_id' => $scenarioId, 'titre' => 'Scène', 'ordre' => 0, 'distribution' => []]);
    }

    /** @param array<int, string>|null $played */
    private function tableSession(string $statut, ?string $scenarioId = null, ?array $played = null): BolFightSession
    {
        return BolFightSession::create(['titre' => 'Table', 'statut' => $statut, 'user_id' => $this->user->id, 'scenario_id' => $scenarioId, 'scenes_jouees' => $played]);
    }

    private function hero(string $nom, string $type = 'H', ?User $owner = null): BolHeros
    {
        return BolHeros::create(['nom' => $nom, 'joueur' => 'J', 'user_id' => ($owner ?? $this->user)->id, 'type' => $type]);
    }

    private function seat(BolFightSession $session, BolHeros $hero, string $camp = 'heros'): void
    {
        BolFightSessionHeros::create(['fight_session_id' => $session->id, 'heros_id' => $hero->id, 'camp' => $camp]);
    }
}
