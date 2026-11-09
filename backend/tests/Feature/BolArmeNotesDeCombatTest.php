<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolFightSessionService;
use App\Models\Bol\BolArme;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolHeros;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Les notes d'armes qui jouent en combat (livre p. 49-50) sont des données de l'arme : le fléau ignore les boucliers, le gourdin peut
 * assommer sans tuer, l'arbalète se recharge. */
class BolArmeNotesDeCombatTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_une_arme_du_compte_garde_ses_notes_de_combat(): void
    {
        $id = $this->postJson('/api/bol/armes/create', $this->arme('Fléau d’arène', ['ignore_bouclier' => true, 'rechargement' => 2]))
            ->assertCreated()
            ->assertJsonPath('ignore_bouclier', true)
            ->assertJsonPath('non_letal', false)
            ->assertJsonPath('rechargement', 2)
            ->json('id');

        $this->postJson('/api/bol/armes/update', ['id' => $id] + $this->arme('Fléau d’arène', ['non_letal' => true, 'rechargement' => null]))
            ->assertOk()
            ->assertJsonPath('ignore_bouclier', false)
            ->assertJsonPath('non_letal', true)
            ->assertJsonPath('rechargement', null);
    }

    public function test_un_rechargement_se_compte_en_rounds(): void
    {
        $this->postJson('/api/bol/armes/create', $this->arme('Baliste', ['rechargement' => 0]))->assertUnprocessable()->assertJsonValidationErrors('rechargement');
        $this->postJson('/api/bol/armes/create', $this->arme('Baliste', ['rechargement' => 10]))->assertUnprocessable()->assertJsonValidationErrors('rechargement');
    }

    public function test_la_migration_lit_ce_que_disent_les_notes(): void
    {
        $migration = require database_path('migrations/2026_11_09_100000_add_notes_de_combat_to_bol_arme.php');
        $migration->down();
        DB::table('bol_arme')->delete();
        foreach ([
            'Fléau' => 'Ignore les boucliers.',
            'Gourdin' => 'Option : dégâts non létaux.',
            'Arbalète' => 'Arme à deux mains ; rechargement : 1 round de combat',
            'Arbalète lourde' => 'Arme à deux mains ; rechargement : 2 rounds de combat',
            'Épée' => 'Inclut cimeterre, glaive, sabre, tulwar.',
            'Dague' => null,
        ] as $arme => $notes) {
            DB::table('bol_arme')->insert(['arme' => $arme, 'type' => 'M', 'degats' => 'd6', 'notes' => $notes]);
        }

        $migration->up();

        $this->assertSame(['Fléau'], DB::table('bol_arme')->where('ignore_bouclier', true)->pluck('arme')->all());
        $this->assertSame(['Gourdin'], DB::table('bol_arme')->where('non_letal', true)->pluck('arme')->all());
        $this->assertSame(['Arbalète' => 1, 'Arbalète lourde' => 2], DB::table('bol_arme')->whereNotNull('rechargement')->pluck('rechargement', 'arme')->map(fn ($r) => (int) $r)->all());
    }

    public function test_un_pnj_pose_a_la_table_emporte_les_notes_de_ses_armes(): void
    {
        $arbalete = BolArme::create(['arme' => 'Arbalète', 'type' => 'T', 'degats' => 'd6', 'portee' => '30m', 'deux_mains' => true, 'rechargement' => 1]);
        $fleau = BolArme::create(['arme' => 'Fléau', 'type' => 'M', 'degats' => 'd6', 'ignore_bouclier' => true]);
        $pnj = BolHeros::create(['nom' => 'Gladiateur', 'joueur' => 'MJ', 'user_id' => $this->user->id, 'type' => 'C']);
        $pnj->armes()->create(['arme_id' => $arbalete->id]);
        $pnj->armes()->create(['arme_id' => $fleau->id]);
        $table = BolFightSession::create(['titre' => 'Table', 'statut' => 'combat', 'user_id' => $this->user->id]);

        $ligne = app(BolFightSessionService::class)->createPnjRow($table->id, $pnj->id, 'adversaires');

        $armes = collect($ligne->fresh()->armes)->keyBy('nom');
        $this->assertSame(1, $armes['Arbalète']['rechargement']);
        $this->assertFalse($armes['Arbalète']['ignore_bouclier']);
        $this->assertTrue($armes['Fléau']['ignore_bouclier']);
        $this->assertNull($armes['Fléau']['rechargement']);
    }

    private function arme(string $nom, array $notes): array
    {
        return ['arme' => $nom, 'type' => 'M', 'degats' => 'd6', 'portee' => null, 'notes' => null] + $notes;
    }
}
