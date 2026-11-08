<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolCache;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolImportRef;
use App\Models\Bol\BolSaga;
use App\Models\Bol\BolScenario;
use App\Models\User;
use Database\Seeders\BolTailleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Le bestiaire dit de quel scénario du compte vient chaque créature, ou lequel la cite : son filtre « Scénario » s'en sert. */
class BolCreatureScenariosTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        (new BolTailleSeeder())->run();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_a_creature_created_by_an_import_names_the_scenario_of_its_chapters(): void
    {
        $saga = $this->chapitres('dieu-voile', 'Le Dieu voilé', ['ch1', 'ch2']);
        $momie = $this->creature('Momie royale', $this->user->id);
        $this->ref('dieu-voile', 'creature', $momie->id);

        $liste = collect($this->getJson('/api/bol/creature')->assertOk()->json())->keyBy('nom');

        $this->assertSame([['id' => $saga->id, 'titre' => 'Le Dieu voilé', 'one_shot' => false]], $liste['Momie royale']['scenarios']);
    }

    public function test_a_catalogue_creature_cited_by_several_scenarios_names_each_once(): void
    {
        $this->chapitres('perle-du-beshaar', 'Perle du Beshaar', ['ch1']);
        $this->chapitres('dieu-voile', 'Le Dieu voilé', ['ch1']);
        $cathgan = $this->creature('Cathgan', null);
        $this->ref('perle-du-beshaar', 'creature', $cathgan->id);
        $this->ref('dieu-voile', 'creature', $cathgan->id);
        $this->ref('dieu-voile', 'creature', $cathgan->id, 'une-autre-cle');
        $loup = $this->creature('Loup', null);

        $liste = collect($this->getJson('/api/bol/creature')->assertOk()->json())->keyBy('nom');

        $this->assertSame(['Le Dieu voilé', 'Perle du Beshaar'], array_column($liste['Cathgan']['scenarios'], 'titre'));
        $this->assertSame([], $liste['Loup']['scenarios']);
    }

    public function test_a_one_shot_is_its_own_scenario(): void
    {
        $chapitre = BolScenario::create(['user_id' => $this->user->id, 'saga_id' => null, 'titre' => 'premier scénario']);
        $this->ref('premier', BolImportRef::TYPE_SCENARIO, $chapitre->id, 'ch');
        $bete = $this->creature('Bête', $this->user->id);
        $this->ref('premier', 'creature', $bete->id);

        $liste = collect($this->getJson('/api/bol/creature')->assertOk()->json())->keyBy('nom');

        $this->assertSame([['id' => $chapitre->id, 'titre' => 'premier scénario', 'one_shot' => true]], $liste['Bête']['scenarios']);
    }

    public function test_another_accounts_imports_do_not_show(): void
    {
        $autre = User::factory()->create();
        $saga = BolSaga::create(['user_id' => $autre->id, 'titre' => 'Le Dieu voilé']);
        $chapitre = BolScenario::create(['user_id' => $autre->id, 'saga_id' => $saga->id, 'numero' => 1, 'titre' => 'Ch']);
        $this->ref('dieu-voile', BolImportRef::TYPE_SCENARIO, $chapitre->id, 'ch1', $autre);
        $cathgan = $this->creature('Cathgan', null);
        $this->ref('dieu-voile', 'creature', $cathgan->id, 'cathgan', $autre);

        $liste = collect($this->getJson('/api/bol/creature')->assertOk()->json())->keyBy('nom');

        $this->assertSame([], $liste['Cathgan']['scenarios']);
    }

    public function test_deleting_a_chapter_or_renaming_its_scenario_clears_the_cached_list(): void
    {
        $saga = $this->chapitres('dieu-voile', 'Le Dieu voilé', ['ch1', 'ch2']);
        $cle = BolCache::creatures($this->user->id);

        Cache::put($cle, ['ancienne liste'], BolCache::TTL);
        $saga->update(['titre' => 'Le Dieu dévoilé']);
        $this->assertFalse(Cache::has($cle));

        Cache::put($cle, ['ancienne liste'], BolCache::TTL);
        BolScenario::where('saga_id', $saga->id)->first()->delete();
        $this->assertFalse(Cache::has($cle));
    }

    /** Une saga et ses chapitres, comme un import les crée : chacun avec sa référence d'import. */
    private function chapitres(string $import, string $titre, array $cles): BolSaga
    {
        $saga = BolSaga::create(['user_id' => $this->user->id, 'titre' => $titre]);
        foreach ($cles as $i => $cle) {
            $chapitre = BolScenario::create(['user_id' => $this->user->id, 'saga_id' => $saga->id, 'numero' => $i + 1, 'titre' => "Chapitre $cle"]);
            $this->ref($import, BolImportRef::TYPE_SCENARIO, $chapitre->id, $cle);
        }

        return $saga;
    }

    private function creature(string $nom, ?string $userId): BolCreature
    {
        if ($userId === null) {
            $id = 'cat-' . md5($nom);
            DB::table('bol_creature')->insert(['id' => $id, 'user_id' => null, 'nom' => $nom, 'vigueur' => 0, 'agilite' => 0, 'esprit' => 0, 'vitalite' => 5, 'attaque' => 0, 'defense' => 0, 'degats' => 'd6', 'protection' => '0', 'id_taille' => 4]);

            return BolCreature::find($id);
        }

        return BolCreature::create(['nom' => $nom, 'user_id' => $userId, 'id_taille' => 4, 'vitalite' => 10]);
    }

    private function ref(string $import, string $kind, string|int $id, ?string $cle = null, ?User $owner = null): void
    {
        BolImportRef::create([
            'user_id' => ($owner ?? $this->user)->id,
            'saga' => $import,
            'type' => $kind === BolImportRef::TYPE_SCENARIO ? BolImportRef::TYPE_SCENARIO : BolImportRef::TYPE_PERSONNAGE,
            'cle' => $cle ?? (string) $id,
            'entity_kind' => $kind,
            'entity_id' => (string) $id,
        ]);
    }
}
