<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Les avantages de terrain disent sur quel terrain leur dé de bonus s'applique. */
class BolTerrainAdvantagesTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION = 'migrations/2026_11_02_140000_terrain_advantages_name_their_terrain.php';

    private const ANCIEN = 'Pister, piéger ou chasser, ainsi que pour d’autres activités similaires de survie';

    public function test_each_terrain_advantage_names_its_terrain(): void
    {
        DB::table('bol_avantage')->insert([
            ['avantage' => 'Fils des plaines', 'de_bonus' => true, 'de_bonus_domaine' => self::ANCIEN],
            ['avantage' => 'Tigre des neiges', 'de_bonus' => true, 'de_bonus_domaine' => self::ANCIEN . '.'],
        ]);

        $migration = require database_path(self::MIGRATION);
        $migration->up();

        $this->assertSame(
            'Dans un paysage de plaine : pister, piéger ou chasser, ainsi que d’autres activités similaires de survie (pas pour combattre).',
            DB::table('bol_avantage')->where('avantage', 'Fils des plaines')->value('de_bonus_domaine'),
        );
        $this->assertStringStartsWith('Dans un paysage neigeux : ', DB::table('bol_avantage')->where('avantage', 'Tigre des neiges')->value('de_bonus_domaine'));
    }

    public function test_keeps_a_text_already_edited(): void
    {
        DB::table('bol_avantage')->insert(['avantage' => 'Montagnard', 'de_bonus' => true, 'de_bonus_domaine' => 'Texte du MJ']);

        $migration = require database_path(self::MIGRATION);
        $migration->up();

        $this->assertSame('Texte du MJ', DB::table('bol_avantage')->where('avantage', 'Montagnard')->value('de_bonus_domaine'));
    }

    public function test_up_and_down_clear_the_cached_advantages_and_regions(): void
    {
        $migration = require database_path(self::MIGRATION);

        foreach (['up', 'down'] as $sens) {
            Cache::put('bol_avantages_all', 'liste périmée', 3600);
            Cache::put('bol_regions_all', 'liste périmée', 3600);

            $migration->{$sens}();

            $this->assertFalse(Cache::has('bol_avantages_all'), $sens);
            $this->assertFalse(Cache::has('bol_regions_all'), $sens);
        }
    }

    public function test_the_seeder_carries_the_same_texts(): void
    {
        $this->seed(\Database\Seeders\BolAvantageSeeder::class);

        foreach (['Fils des plaines', 'Montagnard', 'Pisteur des marais', 'Renard du désert', 'Roi de la jungle', 'Tigre des neiges'] as $avantage) {
            $domaine = DB::table('bol_avantage')->where('avantage', $avantage)->value('de_bonus_domaine');
            $this->assertStringStartsWith('Dans un', $domaine, $avantage);
            $this->assertStringEndsWith('(pas pour combattre).', $domaine, $avantage);
        }
    }
}
