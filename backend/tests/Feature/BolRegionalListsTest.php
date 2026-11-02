<?php

namespace Tests\Feature;

use App\Models\Bol\BolRegion;
use Database\Seeders\BolAvantageSeeder;
use Database\Seeders\BolCarriereSeeder;
use Database\Seeders\BolDesavantageSeeder;
use Database\Seeders\BolLangueSeeder;
use Database\Seeders\BolRegionAvantageSeeder;
use Database\Seeders\BolRegionDesavantageSeeder;
use Database\Seeders\BolRegionNomSeeder;
use Database\Seeders\BolRegionSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

/** Les listes de la Côte de Feu (union de Halakh et des marais de Kasht, sans le kriss) et des Plaines de Klaar (céruléens) : les seeders
 * les écrivent sur une base neuve, la migration les ajoute à une base déjà remplie sans rien doubler. */
class BolRegionalListsTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION = 'migrations/2026_11_02_130000_add_cote_de_feu_and_klaar_regional_lists.php';

    private const COTE_DE_FEU = 1;
    private const HALAKH = 3;
    private const KASHT = 9;
    private const KLAAR = 13;

    protected function setUp(): void
    {
        parent::setUp();

        // Les seeders comptent sur db:seed pour écrire leurs ids : on fait comme lui.
        Model::unguarded(function () {
            foreach ([
                BolLangueSeeder::class, BolCarriereSeeder::class, BolRegionSeeder::class, BolAvantageSeeder::class, BolDesavantageSeeder::class,
                BolRegionAvantageSeeder::class, BolRegionDesavantageSeeder::class, BolRegionNomSeeder::class,
            ] as $seeder) {
                (new $seeder())->run();
            }
        });
    }

    public function test_the_seeders_write_the_lists_of_the_two_regions(): void
    {
        $this->assertSame([10, 6, 50], $this->counts(self::KLAAR));
        $this->assertSame([13, 8, 80], $this->counts(self::COTE_DE_FEU));
        $this->assertCoteDeFeuIsTheUnionWithoutTheKriss();
        $this->assertKlaarIsTheCeruleanList();
    }

    public function test_the_migration_gives_an_existing_database_the_same_lists_as_the_seeders(): void
    {
        $fromSeeders = [self::COTE_DE_FEU => $this->lists(self::COTE_DE_FEU), self::KLAAR => $this->lists(self::KLAAR)];
        $this->emptyTheTwoRegions();
        $this->assertSame([0, 0, 0], $this->counts(self::KLAAR));
        $this->assertSame([0, 0, 0], $this->counts(self::COTE_DE_FEU));

        $this->migration()->up();

        $this->assertSame([10, 6, 50], $this->counts(self::KLAAR));
        $this->assertSame([13, 8, 80], $this->counts(self::COTE_DE_FEU));
        $this->assertSame($fromSeeders[self::KLAAR], $this->lists(self::KLAAR));
        $this->assertSame($fromSeeders[self::COTE_DE_FEU], $this->lists(self::COTE_DE_FEU));
        $this->assertCoteDeFeuIsTheUnionWithoutTheKriss();
        $this->assertKlaarIsTheCeruleanList();

        // Ce que le client reçoit de l'API : la région avec ses listes.
        $klaar = BolRegion::with(['avantages', 'desavantages', 'noms'])->findOrFail(self::KLAAR);
        $this->assertSame([10, 6, 50], [$klaar->avantages->count(), $klaar->desavantages->count(), $klaar->noms->count()]);
    }

    public function test_a_second_run_adds_nothing(): void
    {
        $this->emptyTheTwoRegions();
        $migration = $this->migration();
        $migration->up();
        $before = $this->snapshot();

        $migration->up();

        $this->assertSame($before, $this->snapshot());
    }

    public function test_a_partial_state_is_completed_without_duplicates(): void
    {
        $this->emptyTheTwoRegions();
        // Un nom et un avantage déjà posés à la main : la migration ne les double pas.
        DB::table('bol_region_nom')->insert(['nom' => 'Bork', 'gender' => 'M', 'region_id' => self::KLAAR]);
        DB::table('bol_region_avantage')->insert(['region_id' => self::KLAAR, 'avantage_id' => 15]);

        $this->migration()->up();

        $this->assertSame([10, 6, 50], $this->counts(self::KLAAR));
        $this->assertSame(1, DB::table('bol_region_nom')->where('region_id', self::KLAAR)->where('nom', 'Bork')->count());
    }

    public function test_down_removes_exactly_the_added_rows(): void
    {
        $this->emptyTheTwoRegions();
        // Un nom ajouté à la main dans la région reste après un retour en arrière.
        DB::table('bol_region_nom')->insert(['nom' => 'Zorbo', 'gender' => 'M', 'region_id' => self::COTE_DE_FEU]);
        $others = $this->snapshotOtherRegions();
        $migration = $this->migration();
        $migration->up();

        $migration->down();

        $this->assertSame([0, 0, 0], $this->counts(self::KLAAR));
        $this->assertSame([0, 0, 1], $this->counts(self::COTE_DE_FEU));
        $this->assertSame(['Zorbo'], DB::table('bol_region_nom')->where('region_id', self::COTE_DE_FEU)->pluck('nom')->all());
        $this->assertSame($others, $this->snapshotOtherRegions());
    }

    public function test_the_regions_cache_is_cleared(): void
    {
        $this->emptyTheTwoRegions();
        Cache::put('bol_regions_all', 'liste périmée', 3600);

        $this->migration()->up();

        $this->assertFalse(Cache::has('bol_regions_all'));
    }

    public function test_a_missing_trait_stops_the_migration_before_writing_the_region(): void
    {
        $this->emptyTheTwoRegions();
        DB::table('bol_region_desavantage')->whereIn('desavantage_id', [35])->delete();
        DB::table('bol_desavantage')->where('desavantage', 'Pataud')->delete();

        try {
            $this->migration()->up();
            $this->fail('Un désavantage absent doit arrêter la migration.');
        } catch (RuntimeException $e) {
            $this->assertStringContainsString('Pataud', $e->getMessage());
        }

        $this->assertSame([0, 0, 0], $this->counts(self::KLAAR));
    }

    public function test_a_fresh_database_without_regions_is_left_to_the_seeders(): void
    {
        DB::table('bol_region_nom')->delete();
        DB::table('bol_region_avantage')->delete();
        DB::table('bol_region_desavantage')->delete();
        DB::table('bol_region')->delete();

        $this->migration()->up();

        $this->assertSame(0, DB::table('bol_region_nom')->count() + DB::table('bol_region_avantage')->count() + DB::table('bol_region_desavantage')->count());
    }

    private function migration(): object
    {
        return require database_path(self::MIGRATION);
    }

    /** Comme une base remplie avant ces listes : les deux régions sans avantage, désavantage ni nom. */
    private function emptyTheTwoRegions(): void
    {
        foreach (['bol_region_avantage', 'bol_region_desavantage', 'bol_region_nom'] as $table) {
            DB::table($table)->whereIn('region_id', [self::COTE_DE_FEU, self::KLAAR])->delete();
        }
    }

    /** @return array{0: int, 1: int, 2: int} avantages, désavantages, noms */
    private function counts(int $regionId): array
    {
        return [
            DB::table('bol_region_avantage')->where('region_id', $regionId)->count(),
            DB::table('bol_region_desavantage')->where('region_id', $regionId)->count(),
            DB::table('bol_region_nom')->where('region_id', $regionId)->count(),
        ];
    }

    /** Les listes d'une région, par nom et triées : indépendantes des ids des lignes. */
    private function lists(int $regionId): array
    {
        $names = DB::table('bol_region_nom')->where('region_id', $regionId)->get(['gender', 'nom'])->map(fn ($n) => $n->gender . ' ' . $n->nom)->all();
        sort($names);

        return [
            'avantages' => $this->traitNames('bol_region_avantage', 'bol_avantage', 'avantage', 'avantage_id', $regionId),
            'desavantages' => $this->traitNames('bol_region_desavantage', 'bol_desavantage', 'desavantage', 'desavantage_id', $regionId),
            'noms' => $names,
        ];
    }

    /** @return list<string> */
    private function traitNames(string $pivot, string $table, string $column, string $foreignKey, int $regionId): array
    {
        $names = DB::table($pivot)->join($table, "$table.id", '=', "$pivot.$foreignKey")->where("$pivot.region_id", $regionId)
            ->get(["$table.$column as name", "$pivot.detail"])->map(fn ($t) => $t->name . ($t->detail === null ? '' : " ({$t->detail})"))->all();
        sort($names);

        return $names;
    }

    private function assertCoteDeFeuIsTheUnionWithoutTheKriss(): void
    {
        $halakh = $this->lists(self::HALAKH);
        $kasht = $this->lists(self::KASHT);
        $cote = $this->lists(self::COTE_DE_FEU);

        // L'arme favorite de Halakh est le kriss (Mythic+) : elle reste à Halakh.
        $this->assertContains('Arme favorite (Kriss)', $halakh['avantages']);
        $this->assertNotContains('Arme favorite (Kriss)', $cote['avantages']);
        $this->assertSame(0, DB::table('bol_region_avantage')->where('region_id', self::COTE_DE_FEU)->whereNotNull('detail')->count());

        foreach (['avantages', 'desavantages', 'noms'] as $list) {
            $union = array_values(array_unique(array_merge($halakh[$list], $kasht[$list])));
            $union = array_values(array_filter($union, fn ($t) => $t !== 'Arme favorite (Kriss)'));
            sort($union);
            $this->assertSame($union, $cote[$list], $list);
        }
        $this->assertEqualsCanonicalizing(
            ['Ami des bêtes', 'Athlète', 'Discret', 'Montagnard', 'Odorat développé', 'Ouïe fine', 'Outillage', 'Pisteur des marais', 'Renard du désert',
                'Résistant aux poisons', 'Santé de fer', 'Vigilant', 'Vision nocturne'],
            $cote['avantages'],
        );
    }

    private function assertKlaarIsTheCeruleanList(): void
    {
        $klaar = $this->lists(self::KLAAR);

        $this->assertEqualsCanonicalizing([
            'Ami des bêtes', 'Ami des céruléens', 'Bagarreur', 'Colosse', 'Dur à cuire', 'Fils des plaines', 'Intimidant', 'Peau dure',
            'Récupération rapide', 'Vigueur céruléenne',
        ], $klaar['avantages']);
        $this->assertEqualsCanonicalizing(
            ['Bouseux', 'Deux mains gauches', 'Marin d’eau douce', 'Méfiance envers la sorcellerie', 'Pataud', 'Signe distinctif'],
            $klaar['desavantages'],
        );
        $this->assertSame(25, count(array_filter($klaar['noms'], fn ($n) => str_starts_with($n, 'M '))));
        $this->assertSame(25, count(array_filter($klaar['noms'], fn ($n) => str_starts_with($n, 'F '))));
        // Les deux bouts de liste que l'extraction du livre mêle à une autre colonne.
        $this->assertContains('M Vork', $klaar['noms']);
        $this->assertContains('M Lozzar', $klaar['noms']);
        $this->assertContains('F Rikki', $klaar['noms']);
        $this->assertContains('F Tharki', $klaar['noms']);
    }

    /** Les lignes des trois tables, sans id ni date : ce qu'une deuxième exécution ne doit pas changer. */
    private function snapshot(): array
    {
        return [
            DB::table('bol_region_avantage')->orderBy('id')->get(['id', 'region_id', 'avantage_id', 'detail'])->map(fn ($r) => (array) $r)->all(),
            DB::table('bol_region_desavantage')->orderBy('id')->get(['id', 'region_id', 'desavantage_id', 'detail'])->map(fn ($r) => (array) $r)->all(),
            DB::table('bol_region_nom')->orderBy('id')->get(['id', 'region_id', 'gender', 'nom'])->map(fn ($r) => (array) $r)->all(),
        ];
    }

    private function snapshotOtherRegions(): array
    {
        $other = fn (string $table, array $columns) => DB::table($table)->whereNotIn('region_id', [self::COTE_DE_FEU, self::KLAAR])->orderBy('id')->get($columns)->map(fn ($r) => (array) $r)->all();

        return [
            $other('bol_region_avantage', ['id', 'region_id', 'avantage_id', 'detail']),
            $other('bol_region_desavantage', ['id', 'region_id', 'desavantage_id', 'detail']),
            $other('bol_region_nom', ['id', 'region_id', 'gender', 'nom']),
        ];
    }
}
