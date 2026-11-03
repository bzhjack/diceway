<?php

namespace Tests\Feature;

use App\Models\Bol\BolHeros;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** Les PNJ du catalogue passent aux armes régionales de Mythic+ ; un PNJ de compte du même nom n'est pas touché, une arme de compte du
 * même nom n'est jamais prise. */
class BolNpcRegionalWeaponsTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION = 'migrations/2026_11_02_150000_npcs_take_mythic_plus_regional_weapons.php';

    /** @var array<string, int> */
    private array $armes = [];

    /** @var array<string, int> Armes homonymes d'un compte, créées avant celles du catalogue (leur id est plus petit). */
    private array $armesDeCompte = [];

    protected function setUp(): void
    {
        parent::setUp();

        $proprietaire = User::factory()->create();
        foreach (['Arc', 'Arc de guerre de Tyrus', 'Kriss', 'Arme d’hast', 'Khastok'] as $arme) {
            $this->armesDeCompte[$arme] = DB::table('bol_arme')->insertGetId(['arme' => $arme, 'type' => 'M', 'degats' => 'd3', 'user_id' => $proprietaire->id]);
        }
        // Les armes de Mythic+ sont déjà au catalogue (posées par leur migration) : on reprend celles-là.
        foreach (['Arc', 'Arc de guerre de Tyrus', 'Dague', 'Kriss', 'Arme d’hast', 'Khastok'] as $arme) {
            $this->armes[$arme] = (int) (DB::table('bol_arme')->whereNull('user_id')->where('arme', $arme)->value('id')
                ?? DB::table('bol_arme')->insertGetId(['arme' => $arme, 'type' => 'M', 'degats' => 'd6']));
        }
    }

    public function test_catalogue_npcs_take_their_regional_weapon(): void
    {
        $archer = $this->pnj('Archer de Tyrus', ['Arc', 'Dague']);
        $assassin = $this->pnj('Assassin halakhi', ['Dague']);
        $garde = $this->pnj('Garde jemadar', ['Arme d’hast', 'Dague']);

        $migration = $this->migration();
        $migration->up();
        $migration->up();

        $this->assertSame(['Arc de guerre de Tyrus', 'Dague'], $this->armesDe($archer));
        $this->assertSame(['Dague', 'Kriss'], $this->armesDe($assassin));
        $this->assertSame(['Dague', 'Khastok'], $this->armesDe($garde));
    }

    public function test_down_gives_back_the_book_weapons(): void
    {
        $archer = $this->pnj('Archer de Tyrus', ['Arc', 'Dague']);
        $assassin = $this->pnj('Assassin halakhi', ['Dague']);

        $migration = $this->migration();
        $migration->up();
        $migration->down();

        $this->assertSame(['Arc', 'Dague'], $this->armesDe($archer));
        $this->assertSame(['Dague'], $this->armesDe($assassin));
    }

    public function test_an_account_npc_of_the_same_name_keeps_its_weapons(): void
    {
        $user = User::factory()->create();
        $sien = $this->pnj('Garde jemadar', ['Arme d’hast'], $user->id);

        $this->migration()->up();

        $this->assertSame(['Arme d’hast'], $this->armesDe($sien));
    }

    public function test_the_weapons_are_taken_from_the_catalogue_only(): void
    {
        $archer = $this->pnj('Archer de Tyrus', ['Arc']);
        $assassin = $this->pnj('Assassin halakhi', []);
        $garde = $this->pnj('Garde jemadar', ['Arme d’hast']);

        $this->migration()->up();

        $this->assertSame([$this->armes['Arc de guerre de Tyrus']], $this->armeIdsDe($archer));
        $this->assertSame([$this->armes['Kriss']], $this->armeIdsDe($assassin));
        $this->assertSame([$this->armes['Khastok']], $this->armeIdsDe($garde));
    }

    /** @return list<int> */
    private function armeIdsDe(string $herosId): array
    {
        return DB::table('bol_heros_arme')->where('heros_id', $herosId)->pluck('arme_id')->map(fn ($id) => (int) $id)->all();
    }

    private function migration(): object
    {
        return require database_path(self::MIGRATION);
    }

    /** @param list<string> $armes */
    private function pnj(string $nom, array $armes, ?string $userId = null): string
    {
        $pnj = BolHeros::create(['nom' => $nom, 'joueur' => 'master', 'type' => 'C', 'user_id' => $userId]);
        foreach ($armes as $arme) {
            DB::table('bol_heros_arme')->insert(['heros_id' => $pnj->id, 'arme_id' => $this->armes[$arme], 'equipee' => true]);
        }

        return $pnj->id;
    }

    /** @return list<string> */
    private function armesDe(string $herosId): array
    {
        return DB::table('bol_heros_arme')
            ->join('bol_arme', 'bol_arme.id', '=', 'bol_heros_arme.arme_id')
            ->where('heros_id', $herosId)
            ->orderBy('bol_arme.arme')
            ->pluck('bol_arme.arme')
            ->all();
    }
}
