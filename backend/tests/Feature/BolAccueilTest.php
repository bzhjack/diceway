<?php

namespace Tests\Feature;

use App\Models\Bol\BolArme;
use App\Models\Bol\BolArmure;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
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

    /** Reprendre une table la rouvre et clôt l'autre table ouverte (un combat en cours s'arrête) : une seule table ouverte à la fois. */
    public function test_a_reopened_table_comes_back_as_the_open_table_and_closes_the_other(): void
    {
        $ancienne = $this->tableSession('terminee');
        $this->travel(1)->minutes();
        $recente = $this->tableSession('combat');
        $this->travel(1)->minutes();

        $this->patchJson("/api/bol/fight-session/{$ancienne->id}/reopen")->assertOk();

        $this->assertSame('libre', $ancienne->fresh()->statut);
        $this->assertSame('terminee', $recente->fresh()->statut);
        $this->assertSame($ancienne->id, $this->getJson('/api/bol/accueil')->assertOk()->json('table.id'));
    }

    /** Reprendre une table encore ouverte (deux tables ouvertes d'avant la règle) : elle devient la table de l'accueil, l'autre se clôt. */
    public function test_reopening_an_open_table_makes_it_the_open_table(): void
    {
        $ancienne = $this->tableSession('libre');
        $this->travel(1)->minutes();
        $recente = $this->tableSession('libre');
        $this->travel(1)->minutes();

        $this->patchJson("/api/bol/fight-session/{$ancienne->id}/reopen")->assertOk();

        $this->assertSame('libre', $ancienne->fresh()->statut);
        $this->assertSame('terminee', $recente->fresh()->statut);
        $this->assertSame($ancienne->id, $this->getJson('/api/bol/accueil')->assertOk()->json('table.id'));
    }

    /** Reprendre ne touche pas aux tables d'un autre compte. */
    public function test_reopening_leaves_other_accounts_alone(): void
    {
        $table = $this->tableSession('terminee');
        $autre = BolFightSession::create(['titre' => 'Autre compte', 'statut' => 'libre', 'user_id' => User::factory()->create()->id]);

        $this->patchJson("/api/bol/fight-session/{$table->id}/reopen")->assertOk();

        $this->assertSame('libre', $autre->fresh()->statut);
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

        $this->assertSame(['id', 'titre', 'statut', 'scenario_id', 'scene_id', 'scenes', 'scenes_jouees', 'created_at'], array_keys($table));
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
        $this->assertSame(['id', 'titre', 'numero', 'saga'], array_keys($scenarios[0]));
    }

    /** Chaque chapitre dit son numéro et son scénario (son id et son nom) ; un one shot n'en a pas. */
    public function test_each_chapter_names_its_scenario_and_number(): void
    {
        $saga = BolSaga::create(['user_id' => $this->user->id, 'titre' => 'Perle du Beshaar']);
        $chapitre = BolScenario::create(['user_id' => $this->user->id, 'saga_id' => $saga->id, 'numero' => 2, 'titre' => "De sable et d'eau"]);
        $oneShot = $this->scenario('mon premier scénario');

        $scenarios = collect($this->getJson('/api/bol/accueil')->assertOk()->json('scenarios'))->keyBy('id');

        $this->assertSame(
            ['id' => $chapitre->id, 'titre' => "De sable et d'eau", 'numero' => 2, 'saga' => ['id' => $saga->id, 'titre' => 'Perle du Beshaar']],
            $scenarios[$chapitre->id],
        );
        $this->assertSame(['id' => $oneShot->id, 'titre' => 'mon premier scénario', 'numero' => null, 'saga' => null], $scenarios[$oneShot->id]);
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

    /** Un chapitre qu'une table quitte pour un autre est joué, même sans y avoir chargé de scène ; clore sa table ne le rend pas joué. */
    public function test_a_chapter_left_for_another_counts_as_played_not_a_closed_one(): void
    {
        $premier = $this->scenario('Saga — 1. Premier');
        $second = $this->scenario('Saga — 2. Second');
        $ferme = $this->scenario('Saga — 3. Fermé');
        $improvise = $this->scenario('Saga — 4. Laissé pour improviser');
        $etranger = $this->scenario('Étranger', $other = User::factory()->create());

        $table = $this->tableSession('libre', $premier->id);
        $this->patchJson("/api/bol/fight-session/{$table->id}/scenario", ['scenario_id' => $second->id])->assertOk();
        $close = $this->tableSession('libre', $ferme->id);
        $this->patchJson("/api/bol/fight-session/{$close->id}/close")->assertOk();
        $libre = $this->tableSession('terminee', $improvise->id);
        $this->patchJson("/api/bol/fight-session/{$libre->id}/scenario", ['scenario_id' => null])->assertOk();
        BolFightSession::create(['titre' => 'Autre compte', 'statut' => 'terminee', 'user_id' => $other->id, 'scenario_id' => $etranger->id, 'chapitres_quittes' => [$etranger->id]]);

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertSame([$premier->id], $response->json('scenarios_joues'));
    }

    /** Un chapitre dont toutes les scènes sont passées sur les tables du compte est joué ; à moitié, il ne l'est pas. */
    public function test_a_chapter_counts_as_played_once_all_its_scenes_are(): void
    {
        $fini = $this->scenario('Saga — 1. Fini');
        $entame = $this->scenario('Saga — 2. Entamé');
        $f1 = $this->scene($fini->id);
        $f2 = $this->scene($fini->id);
        $e1 = $this->scene($entame->id);
        $this->scene($entame->id);

        // Les scènes du chapitre fini sont passées sur deux tables (deux compagnies, ou une table reprise).
        $this->tableSession('terminee', $fini->id, [$f1->id]);
        $this->tableSession('libre', $entame->id, [$f2->id, $e1->id]);

        $this->assertSame([$fini->id], $this->getJson('/api/bol/accueil')->assertOk()->json('scenarios_joues'));
    }

    public function test_no_played_scenario_is_an_empty_list(): void
    {
        $this->tableSession('libre');

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertSame([], $response->json('scenarios_joues'));
        $this->assertNull($response->json('scenario_recent_id'));
        $this->assertArrayNotHasKey('derniers_heros', $response->json());
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

    /** Où en est le chapitre de la table : ses scènes dans leur ordre, la scène en cours, et celles déjà passées sur cette table (pas celles
     * d'un autre scénario ni d'une autre table). */
    public function test_the_open_table_tells_where_its_chapter_stands(): void
    {
        $scenario = $this->scenario('Perle du Beshaar — 1. Sacrilège à Satarla');
        $autre = $this->scenario('Perle du Beshaar — 2. De sable et d\'eau');
        $troisieme = BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $scenario->id, 'titre' => 'Le temple', 'ordre' => 2, 'distribution' => []]);
        $premiere = BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $scenario->id, 'titre' => 'La taverne', 'ordre' => 0, 'distribution' => []]);
        $seconde = BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $scenario->id, 'titre' => '', 'lieu' => 'Le trajet', 'ordre' => 1, 'distribution' => []]);
        $ailleurs = $this->scene($autre->id);
        $table = $this->tableSession('combat', $scenario->id, [$premiere->id, $ailleurs->id, $seconde->id]);
        $table->update(['scene_id' => $seconde->id]);

        $reponse = $this->getJson('/api/bol/accueil')->assertOk()->json('table');

        $this->assertSame([
            ['id' => $premiere->id, 'titre' => 'La taverne'],
            ['id' => $seconde->id, 'titre' => 'Le trajet'],
            ['id' => $troisieme->id, 'titre' => 'Le temple'],
        ], $reponse['scenes']);
        $this->assertSame($seconde->id, $reponse['scene_id']);
        $this->assertSame([$premiere->id, $seconde->id], $reponse['scenes_jouees']);
    }

    public function test_an_improvised_table_has_no_scenes(): void
    {
        $this->tableSession('libre');

        $table = $this->getJson('/api/bol/accueil')->assertOk()->json('table');

        $this->assertSame([], $table['scenes']);
        $this->assertSame([], $table['scenes_jouees']);
    }

    /** La compagnie est à la table ouverte, même quand une table plus récente a été close depuis. */
    public function test_company_is_the_open_table_before_a_newer_closed_one(): void
    {
        $axel = $this->hero('Axel');
        $jean = $this->hero('jean');
        $ouverte = $this->tableSession('libre');
        $this->seat($ouverte, $axel);
        $this->travel(1)->minutes();
        $close = $this->tableSession('terminee');
        $this->seat($close, $jean);

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertSame([$axel->id], array_column($response->json('compagnie'), 'id'));
    }

    public function test_company_is_the_last_table_without_open_one(): void
    {
        $h1 = $this->hero('H1');
        $h2 = $this->hero('H2');
        $h3 = $this->hero('H3');
        $pnj = $this->hero('Allié', 'C');
        $foreign = $this->hero('Étranger', 'H', User::factory()->create());

        $old = $this->tableSession('terminee');
        $this->seat($old, $h1);
        $this->travel(1)->minutes();
        $new = $this->tableSession('terminee');
        $this->seat($new, $h2);
        $this->seat($new, $pnj);
        $this->seat($new, $foreign);
        $this->seat($new, $h3);

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertSame([$h2->id, $h3->id], array_column($response->json('compagnie'), 'id'));
    }

    /** Le seuil ne liste que les héros du compte, du camp des héros : les autres seraient comptés sans qu'on puisse les voir. */
    public function test_company_is_the_accounts_own_heroes_on_the_heroes_side(): void
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

        $this->assertSame([$own->id], array_column($response->json('compagnie'), 'id'));
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
        $this->assertSame([], $response->json('compagnie'));
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
