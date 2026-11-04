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

/** L'accueil lit en une requête légère les parties du compte (la dernière jouée en tête, chacune avec sa progression et ses héros), les
 * scénarios et les comptes des bibliothèques. */
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


    public function test_without_partie(): void
    {
        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertNull($response->json('derniere'));
        $this->assertSame([], $response->json('parties'));
        $this->assertSame(['derniere', 'parties', 'scenarios', 'comptes'], array_keys($response->json()));
    }

    /** Toutes les parties, la plus récemment jouée d'abord ; elle est la `derniere`, quel que soit son statut. */
    public function test_lists_every_partie_most_recently_played_first(): void
    {
        $ancienne = $this->partie('Les anciens', ilYa: 30);
        $combat = $this->partie('Les Lames', ilYa: 5);
        $combat->update(['statut' => 'combat']);
        $recente = $this->partie('Les Fils du Serpent', ilYa: 1);

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertSame([$recente->id, $combat->id, $ancienne->id], array_column($response->json('parties'), 'id'));
        $this->assertSame($recente->id, $response->json('derniere'));
    }

    public function test_describes_a_partie(): void
    {
        [$ch1] = $this->saga('Perle du Beshaar', 1);
        $partie = $this->partie('Les Lames', $ch1->id);

        $lue = $this->partieLue($partie->id);

        $this->assertSame(
            ['id', 'titre', 'statut', 'jouee_le', 'scenario_id', 'scene_id', 'scenes', 'scenes_jouees', 'chapitres_joues', 'heros'],
            array_keys($lue),
        );
        $this->assertSame('Les Lames', $lue['titre']);
        $this->assertSame('libre', $lue['statut']);
        $this->assertSame($ch1->id, $lue['scenario_id']);
        $this->assertSame($partie->jouee_le->toIso8601String(), $lue['jouee_le']);
    }

    /** Une ancienne partie sans nom reste listée, son titre à null. */
    public function test_an_old_partie_without_name_is_listed(): void
    {
        $partie = $this->partie();
        $partie->update(['titre' => null]);

        $this->assertNull($this->partieLue($partie->id)['titre']);
    }

    /** La progression est celle de chaque partie : deux compagnies sur le même scénario n'ont pas les mêmes chapitres joués. */
    public function test_played_chapters_are_per_partie(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $a = $this->partie('A', $ch2->id, quittes: [$ch1->id]);
        $b = $this->partie('B', $ch1->id);

        $this->assertSame([$ch1->id], $this->partieLue($a->id)['chapitres_joues']);
        $this->assertSame([], $this->partieLue($b->id)['chapitres_joues']);
    }

    /** Un chapitre dont toutes les scènes sont passées sur cette table est joué pour elle ; à moitié, il ne l'est pas. */
    public function test_a_chapter_with_all_its_scenes_played_on_this_table_is_played(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $s1 = $this->scene($ch1->id);
        $s2 = $this->scene($ch1->id);
        $t1 = $this->scene($ch2->id);
        $this->scene($ch2->id);
        $partie = $this->partie('A', $ch2->id, [$s1->id, $s2->id, $t1->id]);
        $autre = $this->partie('B', $ch1->id, [$s1->id]);

        $this->assertSame([$ch1->id], $this->partieLue($partie->id)['chapitres_joues']);
        $this->assertSame([], $this->partieLue($autre->id)['chapitres_joues']);
    }

    /** Un chapitre sans scène, jamais quitté, n'est pas joué. */
    public function test_a_chapter_without_scene_never_left_is_not_played(): void
    {
        [$ch1] = $this->saga('Perle du Beshaar', 1);
        $partie = $this->partie('A', $ch1->id);

        $this->assertSame([], $this->partieLue($partie->id)['chapitres_joues']);
    }

    /** Où en est le chapitre d'une partie : ses scènes dans leur ordre, la scène en cours, et celles déjà passées sur cette table. */
    public function test_a_partie_tells_where_its_chapter_stands(): void
    {
        $scenario = $this->scenario('Perle du Beshaar — 1. Sacrilège à Satarla');
        $autre = $this->scenario('Perle du Beshaar — 2. De sable et d\'eau');
        $troisieme = BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $scenario->id, 'titre' => 'Le temple', 'ordre' => 2, 'distribution' => []]);
        $premiere = BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $scenario->id, 'titre' => 'La taverne', 'ordre' => 0, 'distribution' => []]);
        $seconde = BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $scenario->id, 'titre' => '', 'lieu' => 'Le trajet', 'ordre' => 1, 'distribution' => []]);
        $ailleurs = $this->scene($autre->id);
        $partie = $this->partie('A', $scenario->id, [$premiere->id, $ailleurs->id, $seconde->id]);
        $partie->update(['scene_id' => $seconde->id]);

        $lue = $this->partieLue($partie->id);

        $this->assertSame([
            ['id' => $premiere->id, 'titre' => 'La taverne'],
            ['id' => $seconde->id, 'titre' => 'Le trajet'],
            ['id' => $troisieme->id, 'titre' => 'Le temple'],
        ], $lue['scenes']);
        $this->assertSame($seconde->id, $lue['scene_id']);
        $this->assertSame([$premiere->id, $seconde->id], $lue['scenes_jouees']);
    }

    public function test_an_improvised_partie_has_no_scenes(): void
    {
        $partie = $this->partie();

        $lue = $this->partieLue($partie->id);

        $this->assertNull($lue['scenario_id']);
        $this->assertSame([], $lue['scenes']);
        $this->assertSame([], $lue['chapitres_joues']);
    }

    /** Les héros d'une partie : ceux du compte, du camp des héros, dans l'ordre où ils ont été posés, avec leur portrait. */
    public function test_partie_heroes_are_the_accounts_own_on_the_heroes_side(): void
    {
        $axel = $this->hero('Axel');
        $balaram = $this->hero('Balaram');
        $balaram->update(['avatar' => '/assets/bol/empty-avatar.jpg']);
        $rival = $this->hero('Rival');
        $pnj = $this->hero('Allié', 'C');
        $catalogue = BolHeros::create(['nom' => 'Catalogue', 'joueur' => 'J', 'user_id' => null, 'type' => 'H']);
        $etranger = $this->hero('Étranger', 'H', User::factory()->create());
        $partie = $this->partie();
        foreach ([$balaram, $catalogue, $pnj, $etranger, $axel] as $heros) {
            $this->seat($partie, $heros);
        }
        $this->seat($partie, $rival, 'adversaires');

        $this->assertSame([
            ['id' => $balaram->id, 'nom' => 'Balaram', 'avatar' => '/assets/bol/empty-avatar.jpg'],
            ['id' => $axel->id, 'nom' => 'Axel', 'avatar' => null],
        ], $this->partieLue($partie->id)['heros']);
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
        $this->partie();
        BolFightSession::create(['titre' => 'Autre', 'statut' => 'libre', 'user_id' => $other->id]);

        $apres = $this->getJson('/api/bol/accueil')->assertOk()->json('comptes');
        $ajoutes = array_map(fn (string $cle) => $apres[$cle] - $avant[$cle], array_combine(array_keys($apres), array_keys($apres)));

        $this->assertSame(['heros' => 1, 'pnjs' => 2, 'creatures' => 2, 'demons' => 2, 'armes' => 2, 'armures' => 2, 'sessions' => 1], $ajoutes);
    }


    public function test_hides_other_accounts(): void
    {
        $other = User::factory()->create();
        $scenario = $this->scenario('Étranger', $other);
        BolFightSession::create(['titre' => 'Autre compte', 'statut' => 'combat', 'user_id' => $other->id, 'scenario_id' => $scenario->id, 'jouee_le' => now()]);

        $response = $this->getJson('/api/bol/accueil')->assertOk();

        $this->assertNull($response->json('derniere'));
        $this->assertSame([], $response->json('parties'));
        $this->assertSame([], $response->json('scenarios'));
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
    /**
     * Une partie du compte, jouée il y a `$ilYa` minutes.
     *
     * @param array<int, string>|null $played
     * @param array<int, string>|null $quittes
     */
    private function partie(string $titre = 'Partie', ?string $scenarioId = null, ?array $played = null, ?array $quittes = null, int $ilYa = 0): BolFightSession
    {
        return BolFightSession::create([
            'titre' => $titre, 'statut' => 'libre', 'user_id' => $this->user->id, 'scenario_id' => $scenarioId,
            'scenes_jouees' => $played, 'chapitres_quittes' => $quittes, 'jouee_le' => now()->subMinutes($ilYa),
        ]);
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

    /** @return array<string, mixed> la partie `$id` dans la réponse de l'accueil */
    private function partieLue(string $id): array
    {
        return collect($this->getJson('/api/bol/accueil')->assertOk()->json('parties'))->firstWhere('id', $id);
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
