<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolFightSessionService;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionDemon;
use App\Models\User;
use Database\Seeders\BolTailleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Un démon a une taille (« n'importe quelle taille », livre p. 129), Moyenne par défaut : la fiche l'enregistre et la sert avec son nom,
 * la table la recopie et suit ses changements, l'import la lit. */
class BolDemonTailleTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private int $categorie;

    protected function setUp(): void
    {
        parent::setUp();

        (new BolTailleSeeder())->run();
        $this->categorie = DB::table('bol_categorie')->insertGetId(['categorie' => 'Majeur', 'type' => 'R']);
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    private function table(): BolFightSession
    {
        return BolFightSession::create(['titre' => 'Table', 'statut' => 'libre', 'user_id' => $this->user->id]);
    }

    public function test_a_demon_is_medium_unless_its_sheet_says_otherwise(): void
    {
        $demon = BolDemon::create(['nom' => 'Limier', 'user_id' => $this->user->id, 'id_categorie' => $this->categorie]);

        $this->assertSame(4, $demon->fresh()->id_taille);
    }

    public function test_the_sheet_saves_and_serves_its_size(): void
    {
        $id = $this->postJson('/api/bol/demon/create', [
            'nom' => 'Ilirk', 'id_categorie' => $this->categorie, 'id_taille' => 7, 'vitalite' => 40, 'degats' => 'd6B', 'pouvoirs' => [],
        ])->assertOk()->json('id');

        $this->getJson("/api/bol/demon/$id")
            ->assertOk()
            ->assertJsonPath('id_taille', 7)
            ->assertJsonPath('taille.taille', 'Enorme');
    }

    public function test_the_table_copies_the_size_and_follows_its_changes(): void
    {
        $demon = BolDemon::create(['nom' => 'Ilirk', 'user_id' => $this->user->id, 'id_categorie' => $this->categorie, 'id_taille' => 5]);
        $service = app(BolFightSessionService::class);

        $row = $service->createDemonRow($this->table()->id, $demon->id, 'adversaires');
        $this->assertSame(5, $row->fresh()->id_taille);

        $demon->update(['id_taille' => 8]);
        $service->refreshDemonSnapshots($demon->id);
        $this->assertSame(8, BolFightSessionDemon::find($row->id)->id_taille);
    }

    public function test_an_imported_demon_keeps_its_size(): void
    {
        $file = tempnam(sys_get_temp_dir(), 'import');
        file_put_contents($file, json_encode([
            'saga' => 'essai',
            'scenario' => ['cle' => 'ch1', 'titre' => 'Essai'],
            'personnages' => [
                'ilirk' => ['kind' => 'demon', 'nom' => 'Ilirk', 'categorie' => 'Majeur', 'taille' => 'Enorme', 'vitalite' => 40, 'degats' => 'd6B'],
                'limier' => ['kind' => 'demon', 'nom' => 'Limier', 'categorie' => 'Majeur', 'vitalite' => 20, 'degats' => 'd6'],
            ],
            'scenes' => [],
        ]));

        try {
            $this->artisan('bol:import-scenario', ['fichier' => $file, '--user' => $this->user->email])->assertSuccessful();
        } finally {
            unlink($file);
        }

        $this->assertSame(7, BolDemon::where('nom', 'Ilirk')->value('id_taille'));
        $this->assertSame(4, BolDemon::where('nom', 'Limier')->value('id_taille'));
    }
}
