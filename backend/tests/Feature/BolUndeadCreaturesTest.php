<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolCache;
use App\Http\Services\Bol\BolFightSessionService;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolDemonPouvoir;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionCreature;
use App\Models\User;
use Database\Seeders\BolCreatureSeeder;
use Database\Seeders\BolTailleSeeder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Les morts-vivants ont une force vitale (Bestiaire, p. 127) : la créature le dit (`mort_vivant`), la migration le pose sur ceux du
 * catalogue, la fiche l'enregistre et la table le recopie ; les pouvoirs d'un démon posé à la table gardent leurs drapeaux de combat. */
class BolUndeadCreaturesTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION = 'migrations/2026_11_02_180000_add_mort_vivant_to_bol_creature.php';

    /** Les morts-vivants du catalogue : le livre (p. 127-128), La Perle du Beshaar et les Chroniques Lémuriennes. */
    private const MORTS_VIVANTS = [
        'Main cavaleuse', 'Nécropède', 'Nécrophage', 'Roi-Sorcier mort-vivant',
        "Momie noire d'humain", 'Momie noire de coursier des sables',
        'Gardien du Royaume Putride', 'Leng shi', 'Mogmaï', 'Windoku',
    ];

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        (new BolTailleSeeder())->run();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    private function migration(): object
    {
        return require database_path(self::MIGRATION);
    }

    private function creature(string $nom, ?string $userId = null, array $over = []): BolCreature
    {
        return BolCreature::create(['nom' => $nom, 'user_id' => $userId, 'id_taille' => 4, 'vitalite' => 10] + $over);
    }

    private function table(): BolFightSession
    {
        return BolFightSession::create(['titre' => 'Table', 'statut' => 'libre', 'user_id' => $this->user->id]);
    }

    public function test_an_imported_creature_keeps_its_undead_flag(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'import');
        file_put_contents($file, json_encode([
            'saga' => 'essai',
            'scenario' => ['cle' => 'ch1', 'titre' => 'Essai'],
            'personnages' => [
                'momie' => ['kind' => 'creature', 'nom' => 'Momie', 'taille' => 'Moyenne', 'vitalite' => 8, 'degats' => 'd6', 'mort_vivant' => true],
                'loup' => ['kind' => 'creature', 'nom' => 'Loup', 'taille' => 'Moyenne', 'vitalite' => 5, 'degats' => 'd6'],
            ],
            'scenes' => [],
        ]));

        try {
            $this->artisan('bol:import-scenario', ['fichier' => $file, '--user' => $this->user->email])->assertSuccessful();
        } finally {
            unlink($file);
        }

        $this->assertTrue(BolCreature::where('nom', 'Momie')->sole()->mort_vivant);
        $this->assertFalse(BolCreature::where('nom', 'Loup')->sole()->mort_vivant);
    }

    public function test_up_marks_the_undead_of_the_catalogue_and_their_copies_at_the_tables(): void
    {
        $migration = $this->migration();
        $migration->down();
        $this->assertFalse(Schema::hasColumn('bol_creature', 'mort_vivant'));
        foreach (self::MORTS_VIVANTS as $nom) {
            DB::table('bol_creature')->insert(['id' => md5($nom), 'user_id' => null, 'nom' => $nom, 'vigueur' => 0, 'agilite' => 0, 'esprit' => 0, 'vitalite' => 3, 'attaque' => 0, 'defense' => 0, 'degats' => 'd3', 'protection' => '0', 'id_taille' => 4]);
        }
        DB::table('bol_creature')->insert(['id' => 'loup', 'user_id' => null, 'nom' => 'Loup', 'vigueur' => 0, 'agilite' => 0, 'esprit' => 0, 'vitalite' => 5, 'attaque' => 0, 'defense' => 0, 'degats' => 'd6', 'protection' => '0', 'id_taille' => 3]);
        DB::table('bol_creature')->insert(['id' => 'sienne', 'user_id' => $this->user->id, 'nom' => 'Nécropède', 'vigueur' => 0, 'agilite' => 0, 'esprit' => 0, 'vitalite' => 30, 'attaque' => 0, 'defense' => 0, 'degats' => 'd6', 'protection' => '0', 'id_taille' => 5]);
        $table = $this->table();
        $copie = ['fight_session_id' => $table->id, 'camp' => 'adversaires', 'rang' => 'coriace', 'vigueur' => 0, 'agilite' => 0, 'esprit' => 0, 'vitalite_max' => 3, 'vitalite_courante' => 3, 'attaque' => 0, 'defense' => 0, 'id_taille' => 4];
        $momie = DB::table('bol_fight_session_creature')->insertGetId(['creature_id' => md5("Momie noire d'humain"), 'nom' => "Momie noire d'humain"] + $copie);
        $loup = DB::table('bol_fight_session_creature')->insertGetId(['creature_id' => 'loup', 'nom' => 'Loup'] + $copie);

        $migration->up();

        $this->assertEqualsCanonicalizing(self::MORTS_VIVANTS, DB::table('bol_creature')->whereNull('user_id')->where('mort_vivant', true)->pluck('nom')->all());
        $this->assertFalse((bool) DB::table('bol_creature')->where('id', 'loup')->value('mort_vivant'));
        // Une créature de compte du même nom n'est pas touchée : c'est au MJ de cocher sa case.
        $this->assertFalse((bool) DB::table('bol_creature')->where('id', 'sienne')->value('mort_vivant'));
        $this->assertTrue((bool) DB::table('bol_fight_session_creature')->where('id', $momie)->value('mort_vivant'));
        $this->assertFalse((bool) DB::table('bol_fight_session_creature')->where('id', $loup)->value('mort_vivant'));
    }

    public function test_up_clears_the_creature_lists_of_the_accounts(): void
    {
        $migration = $this->migration();
        $migration->down();
        Cache::put(BolCache::creatures((string) $this->user->id), ['liste périmée'], BolCache::TTL);

        $migration->up();

        $this->assertNull(Cache::get(BolCache::creatures((string) $this->user->id)));
    }

    public function test_down_removes_the_columns(): void
    {
        $migration = $this->migration();

        $migration->down();

        $this->assertFalse(Schema::hasColumn('bol_creature', 'mort_vivant'));
        $this->assertFalse(Schema::hasColumn('bol_fight_session_creature', 'mort_vivant'));
        $migration->up();
        $this->assertTrue(Schema::hasColumn('bol_creature', 'mort_vivant'));
    }

    public function test_the_seeder_marks_the_same_undead(): void
    {
        Model::unguarded(fn () => (new BolCreatureSeeder())->run());

        $this->assertEqualsCanonicalizing(self::MORTS_VIVANTS, BolCreature::whereNull('user_id')->where('mort_vivant', true)->pluck('nom')->all());
        $this->assertFalse(BolCreature::whereNull('user_id')->where('nom', 'Loup')->value('mort_vivant'));
    }

    public function test_a_new_creature_is_alive_by_default_and_the_sheet_saves_the_box(): void
    {
        $creee = $this->postJson('/api/bol/creature/create', ['nom' => 'Goule', 'id_taille' => 4, 'vitalite' => 10, 'capacites' => []])->assertOk()->json();
        $this->assertFalse($creee['mort_vivant']);

        $this->postJson('/api/bol/creature/update', ['id' => $creee['id'], 'nom' => 'Goule', 'mort_vivant' => true, 'capacites' => []])
            ->assertOk()
            ->assertJsonPath('mort_vivant', true);
        $this->assertTrue(BolCreature::find($creee['id'])->mort_vivant);
    }

    public function test_the_table_copies_the_box_and_follows_a_change_of_the_sheet(): void
    {
        $creature = $this->creature('Goule', $this->user->id, ['mort_vivant' => true]);
        $service = app(BolFightSessionService::class);

        $row = $service->createCreatureRow($this->table()->id, $creature->id, 'adversaires');
        $this->assertTrue($row->fresh()->mort_vivant);

        $creature->update(['mort_vivant' => false]);
        $service->refreshCreatureSnapshots($creature->id);
        $this->assertFalse(BolFightSessionCreature::find($row->id)->mort_vivant);
    }

    public function test_the_table_keeps_the_combat_flags_of_the_powers_of_a_demon(): void
    {
        $categorie = DB::table('bol_categorie')->insertGetId(['categorie' => 'Mineur', 'type' => 'C']);
        $regeneration = DB::table('bol_pouvoir')->insertGetId(['pouvoir' => 'Régénération', 'regeneration' => true]);
        $poison = DB::table('bol_pouvoir')->insertGetId(['pouvoir' => 'Poison', 'avertissement_combat' => true]);
        $intangible = DB::table('bol_pouvoir')->insertGetId(['pouvoir' => 'Intangible', 'intangible' => true, 'avertissement_combat' => true]);
        $demon = BolDemon::create(['nom' => 'Démon', 'user_id' => $this->user->id, 'id_categorie' => $categorie]);
        foreach ([$regeneration, $poison, $intangible] as $id) {
            BolDemonPouvoir::create(['demon_id' => $demon->id, 'pouvoir_id' => $id, 'detail' => null]);
        }

        $row = app(BolFightSessionService::class)->createDemonRow($this->table()->id, $demon->id, 'adversaires');

        $pouvoirs = collect($row->fresh()->pouvoirs)->keyBy('pouvoir');
        $this->assertSame(['regeneration' => true, 'intangible' => false, 'avertissement_combat' => false], array_intersect_key($pouvoirs['Régénération'], array_flip(['regeneration', 'intangible', 'avertissement_combat'])));
        $this->assertTrue($pouvoirs['Poison']['avertissement_combat']);
        $this->assertTrue($pouvoirs['Intangible']['intangible']);
        $this->assertTrue($pouvoirs['Intangible']['avertissement_combat']);
    }
}
