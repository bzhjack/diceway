<?php

namespace Tests\Feature;

use App\Models\Bol\BolSaga;
use App\Models\Bol\BolScenario;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Le scénario (`BolSaga`) et ses chapitres (`BolScenario`) : un chapitre se range dans son scénario d'après son titre d'un seul tenant. */
class BolSagaTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_a_new_chapter_joins_its_scenario_found_by_name_whatever_the_case(): void
    {
        $deux = $this->postJson('/api/bol/scenario/create', ['titre' => "Perle du Beshaar — 2. De sable et d'eau"])->assertOk();
        $trois = $this->postJson('/api/bol/scenario/create', ['titre' => 'PERLE DU BESHAAR — 3. Le tombeau'])->assertOk();

        $this->assertSame("De sable et d'eau", $deux->json('titre'));
        $this->assertSame(2, $deux->json('numero'));
        $this->assertSame('Perle du Beshaar', $deux->json('saga.titre'));
        $this->assertSame($deux->json('saga.id'), $trois->json('saga.id'));
        $this->assertSame(1, BolSaga::where('user_id', $this->user->id)->count());
    }

    public function test_a_chapter_without_em_dash_is_a_one_shot(): void
    {
        $chapitre = $this->postJson('/api/bol/scenario/create', ['titre' => 'mon premier scénario'])->assertOk();

        $this->assertSame('mon premier scénario', $chapitre->json('titre'));
        $this->assertNull($chapitre->json('numero'));
        $this->assertNull($chapitre->json('saga'));
    }

    public function test_never_files_a_chapter_in_another_accounts_scenario(): void
    {
        $etranger = BolSaga::create(['user_id' => User::factory()->create()->id, 'titre' => 'Perle du Beshaar']);

        $chapitre = $this->postJson('/api/bol/scenario/create', ['titre' => 'Perle du Beshaar — 1. Sacrilège à Satarla'])->assertOk();

        $this->assertNotSame($etranger->id, $chapitre->json('saga.id'));
    }

    public function test_the_list_of_chapters_names_their_scenario(): void
    {
        $this->postJson('/api/bol/scenario/create', ['titre' => 'Le Dieu voilé — Introduction : La colère de Nemmereth'])->assertOk();

        $liste = $this->getJson('/api/bol/scenario')->assertOk()->json();

        $this->assertCount(1, $liste);
        $this->assertSame(['titre' => 'La colère de Nemmereth', 'numero' => 0, 'saga' => 'Le Dieu voilé'], [
            'titre'  => $liste[0]['titre'],
            'numero' => $liste[0]['numero'],
            'saga'   => $liste[0]['saga']['titre'],
        ]);
    }

    /** La migration range les chapitres d'avant, dont le scénario n'était que le début du titre ; et défaite, elle rend les titres entiers. */
    public function test_the_migration_files_existing_chapters_and_its_rollback_restores_their_titles(): void
    {
        $migration = require database_path('migrations/2026_11_03_120000_create_bol_saga_and_chapter_numbers.php');
        $migration->down();
        $autre = User::factory()->create();
        $titres = [
            [$this->user, 'Perle du Beshaar — 1. Sacrilège à Satarla'],
            [$this->user, 'perle du beshaar — 2. De sable et d\'eau'],
            [$this->user, 'Le Dieu voilé — Introduction : La colère de Nemmereth'],
            [$this->user, 'mon premier scénario'],
            [$autre, 'Perle du Beshaar — 1. Sacrilège à Satarla'],
        ];
        foreach ($titres as $i => [$compte, $titre]) {
            DB::table('bol_scenario')->insert(['id' => "s$i", 'user_id' => $compte->id, 'titre' => $titre, 'created_at' => now()->addSeconds($i), 'updated_at' => now()]);
        }

        $migration->up();

        $chapitres = BolScenario::with('saga')->orderBy('id')->get()->keyBy('id');
        $this->assertSame(['Sacrilège à Satarla', 1, 'Perle du Beshaar'], [$chapitres['s0']->titre, $chapitres['s0']->numero, $chapitres['s0']->saga->titre]);
        $this->assertSame($chapitres['s0']->saga_id, $chapitres['s1']->saga_id);
        $this->assertSame([0, 'Le Dieu voilé'], [$chapitres['s2']->numero, $chapitres['s2']->saga->titre]);
        $this->assertNull($chapitres['s3']->saga_id);
        $this->assertNotSame($chapitres['s0']->saga_id, $chapitres['s4']->saga_id);
        $this->assertSame(3, BolSaga::count());

        $migration->down();

        // Le scénario garde le nom de son premier chapitre : « perle du beshaar » revient en « Perle du Beshaar ».
        $attendus = array_column($titres, 1);
        $attendus[1] = 'Perle du Beshaar — 2. De sable et d\'eau';
        $this->assertSame($attendus, DB::table('bol_scenario')->orderBy('id')->pluck('titre')->all());
        $migration->up();
    }
}
