<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolCache;
use App\Models\User;
use Database\Seeders\BolCreatureSeeder;
use Database\Seeders\BolTailleSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/** Le Roi-Sorcier mort-vivant du livre (p. 128) : la migration l'ajoute au catalogue des bases déjà remplies, le seeder l'écrit sur une
 * base neuve, et aucune créature de compte n'est touchée. */
class BolUndeadSorcererKingTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION = 'migrations/2026_11_02_160000_add_undead_sorcerer_king_to_catalogue.php';
    private const NOM = 'Roi-Sorcier mort-vivant';

    protected function setUp(): void
    {
        parent::setUp();

        // Une base déjà remplie : ses tailles sont posées (migrate seul, sur une base neuve, ne les pose pas).
        (new BolTailleSeeder())->run();
    }

    private function migration(): object
    {
        return require database_path(self::MIGRATION);
    }

    private function catalogue()
    {
        return DB::table('bol_creature')->whereNull('user_id')->where('nom', self::NOM);
    }

    public function test_up_adds_one_catalogue_creature_with_the_values_of_the_book(): void
    {
        $migration = $this->migration();
        $migration->down();
        $this->assertSame(0, $this->catalogue()->count());

        $migration->up();
        $migration->up();

        $this->assertSame(1, $this->catalogue()->count());
        $roi = $this->catalogue()->first();
        $this->assertSame('75', $roi->id);
        $this->assertSame([3, 0, 3], [(int) $roi->vigueur, (int) $roi->agilite, (int) $roi->esprit]);
        $this->assertSame(13, (int) $roi->vitalite);          // force vitale
        $this->assertSame(2, (int) $roi->attaque);
        $this->assertSame('d6+3', $roi->degats);
        $this->assertSame(2, (int) $roi->defense);
        $this->assertSame('0', $roi->protection);
        $this->assertSame(4, (int) $roi->id_taille);          // Moyenne
        $this->assertStringContainsString('Points de pouvoir : 15', $roi->commentaire);
        $this->assertStringContainsString('Sorcier 3-6', $roi->commentaire);
        $this->assertStringContainsString('Magie des Rois-Sorciers', $roi->commentaire);
        $this->assertStringContainsString('Pouvoir du Néant', $roi->commentaire);
        $this->assertStringContainsString('Inquiétant', $roi->commentaire);
        $this->assertSame(0, DB::table('bol_creature_capacite')->where('creature_id', $roi->id)->count());

        // Les squelettes et les zombies n'ont pas de profil : seule cette fiche est ajoutée.
        $this->assertFalse(DB::table('bol_creature')->whereNull('user_id')->where(fn ($q) => $q->where('nom', 'like', '%quelette%')->orWhere('nom', 'like', '%ombie%'))->exists());
    }

    public function test_up_leaves_a_fresh_database_to_the_seeder(): void
    {
        $migration = $this->migration();
        $migration->down();
        DB::table('bol_taille')->delete();

        $migration->up();

        $this->assertSame(0, $this->catalogue()->count());
    }

    public function test_up_clears_the_creature_lists_of_the_accounts(): void
    {
        $migration = $this->migration();
        $migration->down();
        $user = User::factory()->create();
        Cache::put(BolCache::creatures((string) $user->id), ['liste périmée'], BolCache::TTL);

        $migration->up();

        $this->assertNull(Cache::get(BolCache::creatures((string) $user->id)));
    }

    public function test_down_removes_the_catalogue_row_and_its_links(): void
    {
        $migration = $this->migration();
        $migration->down();
        $migration->up();
        $id = $this->catalogue()->value('id');
        DB::table('bol_creature_capacite')->insert(['creature_id' => $id, 'capacite_id' => 3, 'detail' => 'lien posé à la main']);

        $migration->down();

        $this->assertSame(0, $this->catalogue()->count());
        $this->assertSame(0, DB::table('bol_creature_capacite')->where('creature_id', $id)->count());
    }

    public function test_a_creature_of_an_account_with_the_same_name_is_neither_touched_nor_blocking(): void
    {
        $migration = $this->migration();
        $migration->down();
        $user = User::factory()->create();
        $sien = (string) Str::uuid();
        DB::table('bol_creature')->insert([
            'id' => $sien, 'user_id' => $user->id, 'nom' => self::NOM, 'vigueur' => 1, 'agilite' => 1, 'esprit' => 1, 'vitalite' => 7,
            'attaque' => 1, 'defense' => 1, 'degats' => 'd3', 'protection' => '0', 'id_taille' => 3, 'commentaire' => 'ma version',
        ]);

        $migration->up();

        $this->assertSame(1, $this->catalogue()->count());
        $this->assertSame(2, DB::table('bol_creature')->where('nom', self::NOM)->count());
        $this->assertSame(7, (int) DB::table('bol_creature')->where('id', $sien)->value('vitalite'));

        $migration->down();

        $this->assertSame(0, $this->catalogue()->count());
        $copie = DB::table('bol_creature')->where('id', $sien)->first();
        $this->assertNotNull($copie);
        $this->assertSame([7, 3, 'ma version'], [(int) $copie->vitalite, (int) $copie->id_taille, $copie->commentaire]);
    }

    public function test_up_keeps_the_seeder_id_only_when_it_is_free(): void
    {
        $migration = $this->migration();
        $migration->down();
        DB::table('bol_creature')->insert([
            'id' => '75', 'user_id' => null, 'nom' => 'Occupant de l\'id', 'vigueur' => 0, 'agilite' => 0, 'esprit' => 0, 'vitalite' => 1,
            'attaque' => 0, 'defense' => 0, 'degats' => 'd3', 'protection' => '0', 'id_taille' => 1,
        ]);

        $migration->up();

        $this->assertSame(1, $this->catalogue()->count());
        $this->assertTrue(Str::isUuid($this->catalogue()->value('id')));
        $this->assertSame('Occupant de l\'id', DB::table('bol_creature')->where('id', '75')->value('nom'));
    }

    public function test_the_seeder_writes_the_same_creature_as_the_migration(): void
    {
        $migration = $this->migration();
        $migration->down();
        $migration->up();
        $avant = (array) $this->catalogue()->first();

        Model::unguarded(fn () => (new BolCreatureSeeder())->run());

        $this->assertSame(1, $this->catalogue()->count());
        $apres = (array) $this->catalogue()->first();
        foreach (['created_at', 'updated_at'] as $horodatage) {
            unset($avant[$horodatage], $apres[$horodatage]);
        }
        $this->assertEquals($avant, $apres);
    }
}
