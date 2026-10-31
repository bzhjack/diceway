<?php

namespace Tests\Feature;

use App\Models\Bol\BolArme;
use App\Models\Bol\BolArmure;
use App\Models\Bol\BolCarriere;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionCreature;
use App\Models\Bol\BolFightSessionDemon;
use App\Models\Bol\BolFightSessionHeros;
use App\Models\Bol\BolFightSessionPnj;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosArme;
use App\Models\Bol\BolHerosArmure;
use App\Models\Bol\BolHerosCarriere;
use App\Models\Bol\BolHerosLangue;
use App\Models\Bol\BolHerosTrait;
use App\Models\Bol\BolLangue;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScenarioCreature;
use App\Models\Bol\BolScenarioDemon;
use App\Models\Bol\BolScenarioPj;
use App\Models\Bol\BolScenarioPnj;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use RuntimeException;
use Tests\TestCase;

/** Le compte B ne touche pas aux données du compte A, et personne ne touche au catalogue. */
class BolAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $a;
    private User $b;
    private int $taille;
    private int $categorie;

    protected function setUp(): void
    {
        parent::setUp();

        $this->a = User::factory()->create();
        $this->b = User::factory()->create();
        Sanctum::actingAs($this->b);

        // Le rang d'une créature vient de sa taille, le type d'un démon de sa catégorie : ces deux listes sont obligatoires.
        $this->taille = DB::table('bol_taille')->insertGetId(['taille' => 'Moyenne', 'type' => 'C']);
        $this->categorie = DB::table('bol_categorie')->insertGetId(['categorie' => 'Mineur', 'type' => 'C']);
    }

    public function test_refuses_to_wipe_anything_but_in_memory_sqlite(): void
    {
        $this->assertThrowsWithConfig(['database.default' => 'mysql']);
        $this->assertThrowsWithConfig(['database.connections.sqlite.database' => '/tmp/vraie-base.sqlite']);
    }

    public function test_b_cannot_read_the_sheets_of_a(): void
    {
        foreach ($this->sheetsUrls($this->a->id) as $url) {
            $this->getJson($url)->assertNotFound();
        }
    }

    public function test_a_reads_its_own_sheets(): void
    {
        $urls = $this->sheetsUrls($this->a->id);
        Sanctum::actingAs($this->a);

        foreach ($urls as $url) {
            $this->getJson($url)->assertOk();
        }
    }

    public function test_everyone_reads_the_catalogue(): void
    {
        $pnj = $this->sheet(null, 'C');

        $this->getJson("/api/bol/heros/{$pnj->id}")->assertOk();
        $this->getJson("/api/bol/pnj/{$pnj->id}")->assertOk();
        $this->getJson('/api/bol/creature/' . $this->creature(null)->id)->assertOk();
        $this->getJson('/api/bol/demon/' . $this->demon(null)->id)->assertOk();
    }

    public function test_b_cannot_delete_the_sheets_of_a(): void
    {
        $hero = $this->sheet($this->a->id);
        $pnj = $this->sheet($this->a->id, 'C');
        $creature = $this->creature($this->a->id);
        $demon = $this->demon($this->a->id);
        $scenario = $this->scenario($this->a->id);
        $session = $this->fightSession($this->a->id);

        $this->deleteJson("/api/bol/heros/delete/{$hero->id}")->assertNotFound();
        $this->deleteJson("/api/bol/pnj/delete/{$pnj->id}")->assertNotFound();
        $this->deleteJson("/api/bol/creature/delete/{$creature->id}")->assertNotFound();
        $this->deleteJson("/api/bol/demon/delete/{$demon->id}")->assertNotFound();
        $this->deleteJson("/api/bol/scenario/delete/{$scenario->id}");
        $this->deleteJson("/api/bol/fight-session/delete/{$session->id}");

        foreach ([$hero, $pnj, $creature, $demon, $scenario, $session] as $model) {
            $this->assertModelExists($model);
        }
    }

    public function test_nobody_deletes_the_catalogue(): void
    {
        $pnj = $this->sheet(null, 'C');
        $creature = $this->creature(null);
        $demon = $this->demon(null);
        $arme = $this->arme(null);
        $armure = $this->armure(null);

        $this->deleteJson("/api/bol/heros/delete/{$pnj->id}")->assertNotFound();
        $this->deleteJson("/api/bol/pnj/delete/{$pnj->id}")->assertNotFound();
        $this->deleteJson("/api/bol/creature/delete/{$creature->id}")->assertNotFound();
        $this->deleteJson("/api/bol/demon/delete/{$demon->id}")->assertNotFound();
        $this->deleteJson("/api/bol/armes/delete/{$arme->id}");
        $this->deleteJson("/api/bol/armures/delete/{$armure->id}");

        foreach ([$pnj, $creature, $demon, $arme, $armure] as $model) {
            $this->assertModelExists($model);
        }
    }

    public function test_a_deletes_its_own_sheets(): void
    {
        $hero = $this->sheet($this->a->id);
        $pnj = $this->sheet($this->a->id, 'C');
        $creature = $this->creature($this->a->id);
        $demon = $this->demon($this->a->id);
        Sanctum::actingAs($this->a);

        $this->deleteJson("/api/bol/heros/delete/{$hero->id}")->assertOk();
        $this->deleteJson("/api/bol/pnj/delete/{$pnj->id}")->assertOk();
        $this->deleteJson("/api/bol/creature/delete/{$creature->id}")->assertOk();
        $this->deleteJson("/api/bol/demon/delete/{$demon->id}")->assertOk();

        foreach ([$hero, $pnj, $creature, $demon] as $model) {
            $this->assertModelMissing($model);
        }
    }

    public function test_b_cannot_update_the_origines_of_a_nor_the_catalogue(): void
    {
        $origines = ['nom' => 'Usurpé', 'joueur' => 'B', 'avatar' => null, 'region_id' => null];

        foreach ([$this->sheet($this->a->id), $this->sheet(null, 'C')] as $sheet) {
            $this->postJson("/api/bol/heros/origines/update/{$sheet->id}", $origines)->assertNotFound();
            $this->assertSame('Fiche', $sheet->fresh()->nom);
        }
    }

    public function test_a_updates_its_own_origines(): void
    {
        $hero = $this->sheet($this->a->id);
        Sanctum::actingAs($this->a);

        $this->postJson("/api/bol/heros/origines/update/{$hero->id}", ['nom' => 'Renommé', 'joueur' => 'A', 'avatar' => null, 'region_id' => null])->assertOk();

        $this->assertSame('Renommé', $hero->fresh()->nom);
    }

    public function test_b_cannot_touch_what_is_attached_to_the_sheet_of_a_nor_the_catalogue(): void
    {
        foreach ([$this->sheet($this->a->id), $this->sheet(null, 'C')] as $sheet) {
            $attached = $this->attachEverything($sheet);
            $before = $this->attachedCounts($sheet);

            foreach ($this->attachmentRequests($sheet, $attached) as [$method, $url, $payload]) {
                $this->json($method, $url, $payload)->assertNotFound();
            }

            $this->assertSame($before, $this->attachedCounts($sheet));
            $this->assertFalse((bool) BolHerosArme::where('heros_id', $sheet->id)->value('equipee'));
            $this->assertFalse((bool) BolHerosArmure::where('heros_id', $sheet->id)->value('equipee'));
        }
    }

    public function test_a_manages_what_is_attached_to_its_own_sheet(): void
    {
        $hero = $this->sheet($this->a->id);
        Sanctum::actingAs($this->a);
        $carriere = BolCarriere::create(['carriere' => 'Voleur']);
        $langue = BolLangue::create(['langue' => 'Lémurien']);
        $arme = $this->arme($this->a->id);
        $armure = $this->armure(null);

        $this->postJson("/api/bol/heros/carrieres/create/{$hero->id}", ['carriere_id' => $carriere->id, 'value' => 1])->assertOk();
        $this->postJson("/api/bol/heros/langues/create/{$hero->id}", ['langue_id' => $langue->id])->assertOk();
        $this->postJson("/api/bol/heros/armes/create/{$hero->id}", ['arme_id' => $arme->id])->assertOk();
        $this->postJson("/api/bol/heros/armures/create/{$hero->id}", ['armure_id' => $armure->id])->assertOk();
        $this->assertSame(['carrieres' => 1, 'langues' => 1, 'traits' => 0, 'armes' => 1, 'armures' => 1], $this->attachedCounts($hero));

        $this->patchJson("/api/bol/heros/armes/equip/{$hero->id}/{$arme->id}")->assertOk();
        $this->patchJson("/api/bol/heros/armures/equip/{$hero->id}/{$armure->id}")->assertOk();

        $this->deleteJson("/api/bol/heros/carrieres/delete/{$hero->id}/{$carriere->id}")->assertOk();
        $this->deleteJson("/api/bol/heros/langues/delete/{$hero->id}/{$langue->id}")->assertOk();
        $this->deleteJson("/api/bol/heros/armes/delete/{$hero->id}/{$arme->id}")->assertOk();
        $this->deleteJson("/api/bol/heros/armures/delete/{$hero->id}/{$armure->id}")->assertOk();
        $this->assertSame(['carrieres' => 0, 'langues' => 0, 'traits' => 0, 'armes' => 0, 'armures' => 0], $this->attachedCounts($hero));
    }

    public function test_b_cannot_update_the_pnj_of_a_nor_the_catalogue(): void
    {
        foreach ([$this->sheet($this->a->id, 'C'), $this->sheet(null, 'C')] as $pnj) {
            $this->attachEverything($pnj);
            $before = $this->attachedCounts($pnj);

            $this->postJson('/api/bol/pnj/update', $this->pnjPayload($pnj->id))->assertNotFound();

            $this->assertSame($before, $this->attachedCounts($pnj));
            $this->assertSame('Fiche', $pnj->fresh()->nom);
        }
    }

    public function test_b_cannot_update_the_creature_or_demon_of_a(): void
    {
        $creature = $this->creature($this->a->id);
        $demon = $this->demon($this->a->id);

        $this->postJson('/api/bol/creature/update', ['id' => $creature->id, 'nom' => 'Usurpé', 'capacites' => []])->assertNotFound();
        $this->postJson('/api/bol/demon/update', ['id' => $demon->id, 'nom' => 'Usurpé', 'pouvoirs' => []])->assertNotFound();

        $this->assertSame('Bête', $creature->fresh()->nom);
        $this->assertSame('Démon', $demon->fresh()->nom);
    }

    public function test_an_owner_cannot_publish_a_sheet_to_the_catalogue_nor_give_it_away(): void
    {
        $pnj = $this->sheet($this->a->id, 'C');
        $creature = $this->creature($this->a->id);
        $demon = $this->demon($this->a->id);
        Sanctum::actingAs($this->a);

        foreach ([null, $this->b->id] as $owner) {
            $this->postJson('/api/bol/pnj/update', ['user_id' => $owner] + $this->pnjPayload($pnj->id))->assertOk();
            $this->postJson('/api/bol/creature/update', ['id' => $creature->id, 'user_id' => $owner, 'nom' => 'Renommé', 'capacites' => []])->assertOk();
            $this->postJson('/api/bol/demon/update', ['id' => $demon->id, 'user_id' => $owner, 'nom' => 'Renommé', 'pouvoirs' => []])->assertOk();

            $this->assertSame($this->a->id, $pnj->fresh()->user_id);
            $this->assertSame($this->a->id, $creature->fresh()->user_id);
            $this->assertSame($this->a->id, $demon->fresh()->user_id);
        }

        $this->assertSame('Renommé', $creature->fresh()->nom);
    }

    public function test_creating_cannot_overwrite_a_sheet_nor_choose_the_owner(): void
    {
        $creature = $this->creature($this->a->id);
        $demon = $this->demon($this->a->id);

        $this->postJson('/api/bol/creature/create', ['id' => $creature->id, 'user_id' => $this->a->id, 'nom' => 'Copie', 'id_taille' => $this->taille, 'capacites' => []])->assertOk();
        $this->postJson('/api/bol/demon/create', ['id' => $demon->id, 'user_id' => $this->a->id, 'nom' => 'Copie', 'id_categorie' => $this->categorie, 'pouvoirs' => []])->assertOk();

        $this->assertSame('Bête', $creature->fresh()->nom);
        $this->assertSame('Démon', $demon->fresh()->nom);
        $this->assertSame(1, BolCreature::where('user_id', $this->b->id)->count());
        $this->assertSame(1, BolDemon::where('user_id', $this->b->id)->count());
    }

    public function test_b_cannot_add_the_sheets_of_a_to_its_session(): void
    {
        $session = $this->fightSession($this->b->id);

        foreach ($this->combatants($this->a->id) as [$kind, $sourceId]) {
            $this->postJson("/api/bol/fight-session/{$session->id}/combatant", ['kind' => $kind, 'sourceId' => $sourceId, 'camp' => 'ennemi'])->assertNotFound();
        }

        $this->assertSame([0, 0, 0, 0], $this->sessionRows($session->id));
    }

    public function test_b_adds_its_own_sheets_and_the_catalogue_to_its_session(): void
    {
        $session = $this->fightSession($this->b->id);

        foreach ([...$this->combatants($this->b->id), ...$this->combatants(null)] as [$kind, $sourceId]) {
            $this->postJson("/api/bol/fight-session/{$session->id}/combatant", ['kind' => $kind, 'sourceId' => $sourceId, 'camp' => 'ennemi'])->assertOk();
        }

        $this->assertSame([2, 2, 2, 2], $this->sessionRows($session->id));
    }

    public function test_b_cannot_add_a_combatant_to_the_session_of_a(): void
    {
        $session = $this->fightSession($this->a->id);
        $creature = $this->creature(null);

        $this->postJson("/api/bol/fight-session/{$session->id}/combatant", ['kind' => 'creature', 'sourceId' => $creature->id, 'camp' => 'ennemi'])->assertNotFound();

        $this->assertSame([0, 0, 0, 0], $this->sessionRows($session->id));
    }

    public function test_a_new_session_keeps_only_what_the_account_can_use(): void
    {
        $theirs = $this->sessionPayload($this->a->id);
        $mine = $this->sessionPayload($this->b->id);
        $list = fn (string $key) => [...$theirs[$key], ...$mine[$key]];

        $response = $this->postJson('/api/bol/fight-session/create', [
            'titre' => 'Table',
            'heros' => $list('heros'),
            'creatures' => $list('creatures'),
            'demons' => $list('demons'),
            'pnjs' => $list('pnjs'),
        ])->assertOk();

        $this->assertSame([1, 1, 1, 1], $this->sessionRows($response->json('id')));
        $this->assertSame($mine['creatures'][0]['creatureId'], BolFightSessionCreature::where('fight_session_id', $response->json('id'))->value('creature_id'));
    }

    public function test_a_scenario_keeps_only_what_the_account_can_use(): void
    {
        $theirs = $this->scenarioPayload($this->a->id);
        $mine = $this->scenarioPayload($this->b->id);
        $list = fn (string $key) => [...$theirs[$key], ...$mine[$key]];

        $response = $this->postJson('/api/bol/scenario/create', [
            'titre' => 'Sacrilège',
            'pj' => $list('pj'),
            'creatures' => $list('creatures'),
            'demons' => $list('demons'),
            'pnjs' => $list('pnjs'),
        ])->assertOk();

        $id = $response->json('id');
        $this->assertSame(1, BolScenarioPj::where('scenario_id', $id)->count());
        $this->assertSame(1, BolScenarioCreature::where('scenario_id', $id)->count());
        $this->assertSame(1, BolScenarioDemon::where('scenario_id', $id)->count());
        $this->assertSame(1, BolScenarioPnj::where('scenario_id', $id)->count());
        $this->assertSame($mine['creatures'][0]['creatureId'], BolScenarioCreature::where('scenario_id', $id)->value('creature_id'));
    }

    public function test_b_cannot_update_the_scenario_of_a(): void
    {
        $scenario = $this->scenario($this->a->id);

        $this->postJson('/api/bol/scenario/update', ['id' => $scenario->id, 'titre' => 'Usurpé'])->assertNotFound();

        $this->assertSame('Sacrilège', $scenario->fresh()->titre);
    }

    /** Rattacher l'arme privée d'un autre par son id reviendrait à la lire. */
    public function test_b_cannot_attach_the_private_equipment_of_a(): void
    {
        $arme = $this->arme($this->a->id);
        $armure = $this->armure($this->a->id);
        $armePublique = $this->arme(null);
        $armurePublique = $this->armure(null);
        $hero = $this->sheet($this->b->id);

        $this->postJson("/api/bol/heros/armes/create/{$hero->id}", ['arme_id' => $arme->id])->assertNotFound();
        $this->postJson("/api/bol/heros/armures/create/{$hero->id}", ['armure_id' => $armure->id])->assertNotFound();
        $this->assertSame(['carrieres' => 0, 'langues' => 0, 'traits' => 0, 'armes' => 0, 'armures' => 0], $this->attachedCounts($hero));

        $equipment = ['armes' => [['id' => $arme->id], ['id' => $armePublique->id]], 'armures' => [['id' => $armure->id], ['id' => $armurePublique->id]]];

        $created = $this->postJson('/api/bol/pnj/create', $equipment + ['joueur' => 'B'] + $this->pnjPayload(null))->assertOk();
        $this->assertSame([$armePublique->id], BolHerosArme::where('heros_id', $created->json('id'))->pluck('arme_id')->all());
        $this->assertSame([$armurePublique->id], BolHerosArmure::where('heros_id', $created->json('id'))->pluck('armure_id')->all());

        $pnj = $this->sheet($this->b->id, 'C');
        $this->postJson('/api/bol/pnj/update', $equipment + $this->pnjPayload($pnj->id))->assertOk();
        $this->assertSame([$armePublique->id], BolHerosArme::where('heros_id', $pnj->id)->pluck('arme_id')->all());
        $this->assertSame([$armurePublique->id], BolHerosArmure::where('heros_id', $pnj->id)->pluck('armure_id')->all());

        $newHero = $this->postJson('/api/bol/heros/create', $equipment + ['nom' => 'Neuf', 'joueur' => 'B'])->assertOk();
        $this->assertSame([$armePublique->id], BolHerosArme::where('heros_id', $newHero->json('id'))->pluck('arme_id')->all());
        $this->assertSame([$armurePublique->id], BolHerosArmure::where('heros_id', $newHero->json('id'))->pluck('armure_id')->all());
    }

    public function test_lists_stay_separate_per_account(): void
    {
        $catalogue = $this->creature(null);
        $demonCatalogue = $this->demon(null);
        $mine = $this->creature($this->b->id);
        $myDemon = $this->demon($this->b->id);
        $theirs = $this->creature($this->a->id);
        $theirDemon = $this->demon($this->a->id);

        // A remplit le cache le premier : avec une clé commune, B verrait ses fiches à sa place.
        Sanctum::actingAs($this->a);
        $this->assertIds([$catalogue->id, $theirs->id], '/api/bol/creature');
        $this->assertIds([$demonCatalogue->id, $theirDemon->id], '/api/bol/demon');

        Sanctum::actingAs($this->b);
        $this->assertIds([$catalogue->id, $mine->id], '/api/bol/creature');
        $this->assertIds([$demonCatalogue->id, $myDemon->id], '/api/bol/demon');
    }

    public function test_a_change_refreshes_the_list_of_its_account(): void
    {
        $this->assertIds([], '/api/bol/creature');
        $this->assertIds([], '/api/bol/demon');

        $creature = $this->postJson('/api/bol/creature/create', ['nom' => 'Bête', 'id_taille' => $this->taille, 'capacites' => []])->assertOk()->json('id');
        $demon = $this->postJson('/api/bol/demon/create', ['nom' => 'Démon', 'id_categorie' => $this->categorie, 'pouvoirs' => []])->assertOk()->json('id');

        $this->assertIds([$creature], '/api/bol/creature');
        $this->assertIds([$demon], '/api/bol/demon');

        $this->deleteJson("/api/bol/creature/delete/{$creature}")->assertOk();
        $this->deleteJson("/api/bol/demon/delete/{$demon}")->assertOk();

        $this->assertIds([], '/api/bol/creature');
        $this->assertIds([], '/api/bol/demon');
    }

    public function test_an_import_refreshes_the_list_of_its_account(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'import');
        file_put_contents($file, json_encode([
            'saga' => 'essai',
            'scenario' => ['cle' => 'ch1', 'titre' => 'Essai'],
            'personnages' => ['hippocampe' => [
                'kind' => 'creature', 'nom' => 'Hippocampe', 'taille' => 'Moyenne',
                'vigueur' => 0, 'agilite' => 0, 'esprit' => 0, 'attaque' => 0, 'defense' => 0, 'vitalite' => 1, 'degats' => 'd6',
            ]],
            'scenes' => [],
        ]));

        $this->assertIds([], '/api/bol/creature');

        $this->artisan('bol:import-scenario', ['fichier' => $file, '--user' => $this->b->email])->assertSuccessful();
        unlink($file);

        $this->assertIds([BolCreature::where('user_id', $this->b->id)->sole()->id], '/api/bol/creature');
    }

    private function assertThrowsWithConfig(array $config): void
    {
        $saved = array_map(fn (string $key) => config($key), array_combine(array_keys($config), array_keys($config)));
        config($config);

        try {
            $this->assertThrows(fn () => $this->refuseRealDatabase(), RuntimeException::class);
        } finally {
            config($saved);
        }
    }

    private function assertIds(array $expected, string $url): void
    {
        $ids = array_column($this->getJson($url)->assertOk()->json(), 'id');

        $this->assertEqualsCanonicalizing($expected, $ids);
    }

    /** @return string[] */
    private function sheetsUrls(string $userId): array
    {
        return [
            '/api/bol/heros/' . $this->sheet($userId)->id,
            '/api/bol/pnj/' . $this->sheet($userId, 'C')->id,
            '/api/bol/heros/' . $this->sheet($userId, 'C')->id,
            '/api/bol/creature/' . $this->creature($userId)->id,
            '/api/bol/demon/' . $this->demon($userId)->id,
            '/api/bol/scenario/' . $this->scenario($userId)->id,
            '/api/bol/fight-session/' . $this->fightSession($userId)->id,
        ];
    }

    private function sheet(?string $userId, string $type = 'H'): BolHeros
    {
        return BolHeros::create(['nom' => 'Fiche', 'joueur' => 'Joueur', 'user_id' => $userId, 'type' => $type]);
    }

    private function creature(?string $userId): BolCreature
    {
        return BolCreature::create(['nom' => 'Bête', 'user_id' => $userId, 'id_taille' => $this->taille]);
    }

    private function demon(?string $userId): BolDemon
    {
        return BolDemon::create(['nom' => 'Démon', 'user_id' => $userId, 'id_categorie' => $this->categorie]);
    }

    private function arme(?string $userId): BolArme
    {
        return BolArme::create(['arme' => 'Lame', 'type' => 'corps à corps', 'degats' => 'd6', 'user_id' => $userId]);
    }

    private function armure(?string $userId): BolArmure
    {
        return BolArmure::create(['armure' => 'Cuir', 'protection' => '1', 'user_id' => $userId]);
    }

    private function scenario(string $userId): BolScenario
    {
        return BolScenario::create(['titre' => 'Sacrilège', 'user_id' => $userId]);
    }

    private function fightSession(string $userId): BolFightSession
    {
        return BolFightSession::create(['titre' => 'Table', 'user_id' => $userId, 'statut' => 'libre']);
    }

    /** @return array{carriere: int, langue: int, trait: int, arme: int, armure: int} */
    private function attachEverything(BolHeros $sheet): array
    {
        $attached = [
            'carriere' => BolCarriere::create(['carriere' => 'Voleur'])->id,
            'langue' => BolLangue::create(['langue' => 'Lémurien'])->id,
            'trait' => 7,
            'arme' => $this->arme(null)->id,
            'armure' => $this->armure(null)->id,
        ];

        BolHerosCarriere::create(['heros_id' => $sheet->id, 'carriere_id' => $attached['carriere'], 'value' => 1]);
        BolHerosLangue::create(['heros_id' => $sheet->id, 'langue_id' => $attached['langue']]);
        BolHerosTrait::create(['heros_id' => $sheet->id, 'traitable_id' => $attached['trait'], 'type' => 'A', 'traitable_type' => 'App\\Models\\Bol\\BolAvantage']);
        BolHerosArme::create(['heros_id' => $sheet->id, 'arme_id' => $attached['arme'], 'equipee' => false]);
        BolHerosArmure::create(['heros_id' => $sheet->id, 'armure_id' => $attached['armure'], 'equipee' => false]);

        return $attached;
    }

    /** @return array<int, array{string, string, array<string, mixed>}> */
    private function attachmentRequests(BolHeros $sheet, array $attached): array
    {
        $armeLibre = $this->arme(null)->id;
        $armureLibre = $this->armure(null)->id;

        return [
            ['POST', "/api/bol/heros/carrieres/create/{$sheet->id}", ['carriere_id' => BolCarriere::create(['carriere' => 'Marin'])->id, 'value' => 1]],
            ['POST', "/api/bol/heros/langues/create/{$sheet->id}", ['langue_id' => BolLangue::create(['langue' => 'Satarléen'])->id]],
            ['POST', "/api/bol/heros/traits/create/{$sheet->id}", ['traitable_id' => 8, 'type' => 'A', 'detail' => null, 'region_id' => null]],
            ['POST', "/api/bol/heros/armes/create/{$sheet->id}", ['arme_id' => $armeLibre]],
            ['POST', "/api/bol/heros/armures/create/{$sheet->id}", ['armure_id' => $armureLibre]],
            ['PATCH', "/api/bol/heros/armes/equip/{$sheet->id}/{$attached['arme']}", []],
            ['PATCH', "/api/bol/heros/armures/equip/{$sheet->id}/{$attached['armure']}", []],
            ['DELETE', "/api/bol/heros/carrieres/delete/{$sheet->id}/{$attached['carriere']}", []],
            ['DELETE', "/api/bol/heros/langues/delete/{$sheet->id}/{$attached['langue']}", []],
            ['DELETE', "/api/bol/heros/traits/delete/{$sheet->id}/{$attached['trait']}", []],
            ['DELETE', "/api/bol/heros/armes/delete/{$sheet->id}/{$attached['arme']}", []],
            ['DELETE', "/api/bol/heros/armures/delete/{$sheet->id}/{$attached['armure']}", []],
        ];
    }

    /** @return array<string, int> */
    private function attachedCounts(BolHeros $sheet): array
    {
        return [
            'carrieres' => BolHerosCarriere::where('heros_id', $sheet->id)->count(),
            'langues' => BolHerosLangue::where('heros_id', $sheet->id)->count(),
            'traits' => BolHerosTrait::where('heros_id', $sheet->id)->count(),
            'armes' => BolHerosArme::where('heros_id', $sheet->id)->count(),
            'armures' => BolHerosArmure::where('heros_id', $sheet->id)->count(),
        ];
    }

    /** Relations vides et nom changé : si la mise à jour passait, la fiche perdrait tout. */
    private function pnjPayload(?string $id): array
    {
        return ['id' => $id, 'nom' => 'Usurpé', 'carrieres' => [], 'armes' => [], 'armures' => [], 'langues' => [], 'traits' => []];
    }

    /** @return array<int, array{string, string}> */
    private function combatants(?string $userId): array
    {
        return [
            ['hero', $this->sheet($userId)->id],
            ['pnj', $this->sheet($userId, 'C')->id],
            ['creature', $this->creature($userId)->id],
            ['demon', $this->demon($userId)->id],
        ];
    }

    /** @return int[] Héros, PNJ, créatures, démons posés sur la table. */
    private function sessionRows(string $sessionId): array
    {
        return [
            BolFightSessionHeros::where('fight_session_id', $sessionId)->count(),
            BolFightSessionPnj::where('fight_session_id', $sessionId)->count(),
            BolFightSessionCreature::where('fight_session_id', $sessionId)->count(),
            BolFightSessionDemon::where('fight_session_id', $sessionId)->count(),
        ];
    }

    private function sessionPayload(string $userId): array
    {
        return [
            'heros' => [['heroId' => $this->sheet($userId)->id, 'camp' => 'allie']],
            'pnjs' => [['pnjId' => $this->sheet($userId, 'C')->id, 'camp' => 'ennemi']],
            'creatures' => [['creatureId' => $this->creature($userId)->id, 'camp' => 'ennemi']],
            'demons' => [['demonId' => $this->demon($userId)->id, 'camp' => 'ennemi']],
        ];
    }

    private function scenarioPayload(string $userId): array
    {
        return [
            'pj' => [['heroId' => $this->sheet($userId)->id]],
            'pnjs' => [['pnjId' => $this->sheet($userId, 'C')->id]],
            'creatures' => [['creatureId' => $this->creature($userId)->id]],
            'demons' => [['demonId' => $this->demon($userId)->id]],
        ];
    }
}
