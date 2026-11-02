<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\BolArmeSeeder;
use Database\Seeders\BolArmureSeeder;
use Database\Seeders\BolAvantageSeeder;
use Database\Seeders\BolCapaciteSeeder;
use Database\Seeders\BolCarriereSeeder;
use Database\Seeders\BolCategorieSeeder;
use Database\Seeders\BolCreatureSeeder;
use Database\Seeders\BolDemonSeeder;
use Database\Seeders\BolDesavantageSeeder;
use Database\Seeders\BolLangueSeeder;
use Database\Seeders\BolPnjSeeder;
use Database\Seeders\BolPouvoirSeeder;
use Database\Seeders\BolRegionDesavantageSeeder;
use Database\Seeders\BolRegionSeeder;
use Database\Seeders\BolTailleSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/** Les données de référence corrigées d'après le livre : les seeders les écrivent sur une base neuve, la migration les répare sur une
 * base déjà remplie sans toucher aux fiches des comptes. */
class BolReferenceDataAuditTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION = 'migrations/2026_11_02_120000_fix_reference_data_from_rulebook_audit.php';

    protected function setUp(): void
    {
        parent::setUp();

        // Les tailles et les capacités passent même hors de db:seed, qui désactive la protection des modèles.
        (new BolTailleSeeder())->run();
        (new BolCapaciteSeeder())->run();
        // Les autres seeders comptent sur db:seed pour écrire leurs ids : on fait comme lui.
        Model::unguarded(function () {
            foreach ([
                BolLangueSeeder::class, BolCarriereSeeder::class, BolRegionSeeder::class, BolAvantageSeeder::class, BolDesavantageSeeder::class,
                BolRegionDesavantageSeeder::class, BolArmeSeeder::class, BolArmureSeeder::class, BolCreatureSeeder::class,
                BolCategorieSeeder::class, BolPouvoirSeeder::class, BolDemonSeeder::class, BolPnjSeeder::class,
            ] as $seeder) {
                (new $seeder())->run();
            }
        });
    }

    public function test_the_seeders_write_the_values_of_the_book(): void
    {
        $this->assertSame('Très petite', DB::table('bol_taille')->where('id', 2)->value('taille'));
        $this->assertSame('Attaque spéciale', DB::table('bol_capacite')->where('id', 3)->value('capacite'));
        $this->assertCatalogueIsFixed();
    }

    public function test_the_migration_fixes_the_catalogue_and_leaves_the_accounts_alone(): void
    {
        $migration = require database_path(self::MIGRATION);
        $migration->down();
        $this->assertSame(1, $this->tailleDe('Cathgan'));
        $this->assertSame(1, (int) $this->pnj('Sergent du guet')->defense);
        $this->assertNull(DB::table('bol_region')->where('region', 'Satarla')->value('carrieres_interdites'));

        // Un compte a ses propres fiches du même nom, avec les anciennes valeurs.
        $user = User::factory()->create();
        $cathgan = (string) Str::uuid();
        DB::table('bol_creature')->insert([
            'id' => $cathgan, 'user_id' => $user->id, 'nom' => 'Cathgan', 'vigueur' => 0, 'agilite' => 0, 'esprit' => 0, 'vitalite' => 2, 'attaque' => 0,
            'defense' => 0, 'degats' => 'd3', 'protection' => '0', 'id_taille' => 1,
        ]);
        DB::table('bol_creature_capacite')->insert([
            'creature_id' => $cathgan, 'capacite_id' => 3,
            'detail' => 'Les autres doivent réussir un jet de vigueur très difficile (-6) ou tomber dans un coma de 1d6 jours mortel sans antidote.',
        ]);
        $sergent = (string) Str::uuid();
        DB::table('bol_heros')->insert(['id' => $sergent, 'user_id' => $user->id, 'nom' => 'Sergent du guet', 'joueur' => 'master', 'type' => 'C', 'defense' => 1]);
        $demon = (string) Str::uuid();
        DB::table('bol_demon')->insert(['id' => $demon, 'user_id' => $user->id, 'nom' => 'Vul’mazzanlu, la chose singe']);

        $migration->up();
        $migration->up();

        $this->assertCatalogueIsFixed();
        $this->assertSame(1, (int) DB::table('bol_creature')->where('id', $cathgan)->value('id_taille'));
        $this->assertSame(1, DB::table('bol_creature_capacite')->where('creature_id', $cathgan)->count());
        $this->assertSame(1, (int) DB::table('bol_heros')->where('id', $sergent)->value('defense'));
        $this->assertSame('Vul’mazzanlu, la chose singe', DB::table('bol_demon')->where('id', $demon)->value('nom'));
    }

    private function assertCatalogueIsFixed(): void
    {
        foreach ([
            'Cathgan' => 2, 'Jemadar' => 6, 'Kalathorn' => 10, 'Mythunga' => 7, 'Ours des cavernes / ours polaire' => 7, 'Poad' => 9,
            'Scorpion-araignée géant' => 9, 'Xolth' => 11, 'Zathog' => 7,
        ] as $nom => $taille) {
            $this->assertSame($taille, $this->tailleDe($nom), $nom);
        }

        $this->assertStringContainsString('ardu (-1)', $this->capacite('Anguille chasseresse', 3));
        $this->assertStringContainsString('impossible (-6)', $this->capacite('Sardolith', 4));
        $this->assertStringContainsString('d6x2 dégâts', $this->capacite('Jit', 3));
        $this->assertStringContainsString('étrangle', $this->capacite('Main cavaleuse', 3));
        $this->assertSame(1, $this->liensCapacite('Main cavaleuse', 3));
        $this->assertSame(1, $this->liensCapacite('Nécropède', 1));

        $oomis = DB::table('bol_region_desavantage')->where('region_id', 11)->pluck('desavantage_id')->map(fn ($id) => (int) $id)->all();
        $this->assertEqualsCanonicalizing([9, 12, 24, 26], $oomis);
        $this->assertSame([15], json_decode(DB::table('bol_region')->where('region', 'Satarla')->value('carrieres_interdites'), true));

        $this->assertStringContainsString('ivre', DB::table('bol_desavantage')->where('desavantage', 'Soiffard')->value('description'));
        $this->assertStringContainsString('démons mineurs la suivante', DB::table('bol_pouvoir')->where('pouvoir', 'Progéniture')->value('description'));
        $this->assertTrue(DB::table('bol_demon')->whereNull('user_id')->where('nom', 'Vul’mazzanlu, la chose-singe')->exists());

        $this->assertSame(0, (int) $this->pnj('Sergent du guet')->defense);
        $this->assertSame(0, (int) $this->pnj('Sentinelle kalukan')->defense);
        $methyn = $this->pnj('Methyn Sarr, la Reine Sorcière')->id;
        $this->assertSame(2, (int) DB::table('bol_heros_carriere')->where('heros_id', $methyn)->where('carriere_id', 21)->value('value'));
        $this->assertSame(4, DB::table('bol_heros_carriere')->where('heros_id', $methyn)->count());
    }

    private function tailleDe(string $nom): int
    {
        return (int) DB::table('bol_creature')->whereNull('user_id')->where('nom', $nom)->value('id_taille');
    }

    private function capacite(string $creature, int $capaciteId): string
    {
        return (string) DB::table('bol_creature_capacite')
            ->where('creature_id', DB::table('bol_creature')->whereNull('user_id')->where('nom', $creature)->value('id'))
            ->where('capacite_id', $capaciteId)
            ->value('detail');
    }

    private function liensCapacite(string $creature, int $capaciteId): int
    {
        return DB::table('bol_creature_capacite')
            ->where('creature_id', DB::table('bol_creature')->whereNull('user_id')->where('nom', $creature)->value('id'))
            ->where('capacite_id', $capaciteId)
            ->count();
    }

    private function pnj(string $nom): object
    {
        return DB::table('bol_heros')->whereNull('user_id')->where('nom', $nom)->first();
    }
}
