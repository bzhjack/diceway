<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** « Se tient à deux mains » est une donnée de l'arme : le combat à deux armes ne lit plus ses notes. */
class BolArmeDeuxMainsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->create());
    }

    public function test_a_weapon_of_the_catalogue_keeps_the_flag(): void
    {
        $id = $this->postJson('/api/bol/armes/create', $this->arme('Arc de chasse', true))->assertCreated()->assertJsonPath('deux_mains', true)->json('id');

        $this->postJson('/api/bol/armes/update', ['id' => $id] + $this->arme('Arc de chasse', false))->assertOk()->assertJsonPath('deux_mains', false);
    }

    public function test_a_weapon_is_held_in_one_hand_unless_told_otherwise(): void
    {
        $this->postJson('/api/bol/armes/create', ['arme' => 'Dague de poche', 'type' => 'M', 'degats' => 'd6M'])->assertCreated();

        $this->assertSame(0, (int) DB::table('bol_arme')->where('arme', 'Dague de poche')->value('deux_mains'));
    }

    public function test_the_migration_reads_what_the_notes_used_to_say(): void
    {
        $migration = require database_path('migrations/2026_11_01_130000_add_deux_mains_to_bol_arme.php');
        $migration->down();
        DB::table('bol_arme')->delete();
        foreach ([
            'Hast' => 'Arme à deux mains.',
            'Bâton' => 'Armes à deux mains.',
            'Arbalète' => 'Arme à deux mains ; rechargement : 1 round de combat',
            'Fronde' => 'Arme à une main / arme à deux mains.',
            'Hache' => 'Se manie à une ou deux mains.',
            'Épée' => null,
        ] as $arme => $notes) {
            DB::table('bol_arme')->insert(['arme' => $arme, 'type' => 'M', 'degats' => 'd6', 'notes' => $notes]);
        }

        $migration->up();

        $this->assertEqualsCanonicalizing(['Hast', 'Bâton', 'Arbalète'], DB::table('bol_arme')->where('deux_mains', true)->pluck('arme')->all());
    }

    private function arme(string $nom, bool $deuxMains): array
    {
        return ['arme' => $nom, 'type' => 'T', 'degats' => 'd6', 'portee' => '22 m', 'notes' => null, 'deux_mains' => $deuxMains];
    }
}
