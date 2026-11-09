<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolCache;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolImportRef;
use App\Models\Bol\BolSaga;
use App\Models\Bol\BolScenario;
use App\Models\User;
use Database\Seeders\BolCategorieSeeder;
use Database\Seeders\BolTailleSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Les bibliothèques (créatures, démons, PNJ) disent de quel scénario du compte vient chaque fiche, ou lequel la cite : leur filtre
 * « Scénario » s'en sert. */
class BolFichesScenariosTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        (new BolTailleSeeder())->run();
        Model::unguarded(fn () => (new BolCategorieSeeder())->run());
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_a_creature_created_by_an_import_names_the_scenario_of_its_chapters(): void
    {
        $saga = $this->chapitres('dieu-voile', 'Le Dieu voilé', ['ch1', 'ch2']);
        $momie = $this->creature('Momie royale', $this->user->id);
        $this->ref('dieu-voile', 'creature', $momie->id);

        $liste = collect($this->getJson('/api/bol/creature')->assertOk()->json())->keyBy('nom');

        $this->assertSame([['id' => $saga->id, 'titre' => 'Le Dieu voilé']], $liste['Momie royale']['scenarios']);
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

    public function test_demons_and_npcs_name_their_scenarios_too(): void
    {
        $saga = $this->chapitres('perle-du-beshaar', 'Perle du Beshaar', ['ch1']);
        DB::table('bol_demon')->insert(['id' => 'ilirk', 'user_id' => $this->user->id, 'nom' => 'Ilirk', 'vigueur' => 0, 'agilite' => 0, 'esprit' => 0, 'aura' => 0, 'melee' => 0, 'tir' => 0, 'defense' => 0, 'vitalite' => 20, 'degats' => 'd6', 'id_categorie' => 2]);
        $this->ref('perle-du-beshaar', 'demon', 'ilirk');
        $pnj = BolHeros::create(['nom' => 'Garde', 'joueur' => '', 'user_id' => $this->user->id, 'type' => 'C']);
        $this->ref('perle-du-beshaar', 'pnj', $pnj->id);
        $attendu = [['id' => $saga->id, 'titre' => 'Perle du Beshaar']];

        $demons = collect($this->getJson('/api/bol/demon')->assertOk()->json())->keyBy('nom');
        $pnjs = collect($this->getJson('/api/bol/pnj')->assertOk()->json())->keyBy('origines.nom');

        $this->assertSame($attendu, $demons['Ilirk']['scenarios']);
        $this->assertSame($attendu, $pnjs['Garde']['scenarios']);
    }

    public function test_deleting_a_chapter_or_renaming_its_scenario_clears_the_cached_list(): void
    {
        $saga = $this->chapitres('dieu-voile', 'Le Dieu voilé', ['ch1', 'ch2']);
        $cles = [BolCache::creatures($this->user->id), BolCache::demons($this->user->id)];
        $remplir = fn () => array_map(fn ($cle) => Cache::put($cle, ['ancienne liste'], BolCache::TTL), $cles);

        $remplir();
        $saga->update(['titre' => 'Le Dieu dévoilé']);
        foreach ($cles as $cle) {
            $this->assertFalse(Cache::has($cle));
        }

        $remplir();
        BolScenario::where('saga_id', $saga->id)->first()->delete();
        foreach ($cles as $cle) {
            $this->assertFalse(Cache::has($cle));
        }
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
