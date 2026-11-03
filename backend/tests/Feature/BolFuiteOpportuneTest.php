<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolFightSessionService;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionPnj;
use App\Models\Bol\BolHeros;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** « Fuite opportune » (livre p. 135) : un rival adverse dépense 1 point de vilénie et quitte le combat. La dépense et la fuite sont
 * enregistrées ensemble, en une seule fois : jamais la vilénie perdue sans que le rival soit parti, ni l'inverse. */
class BolFuiteOpportuneTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    private function table(string $statut = 'combat', ?string $userId = null): BolFightSession
    {
        return BolFightSession::create([
            'titre'       => 'Table',
            'statut'      => $statut,
            'user_id'     => $userId ?? $this->user->id,
            'etat_combat' => ['round' => 3, 'joues' => ['hero-1'], 'exclus' => ['creature-4']],
        ]);
    }

    private function ligne(BolFightSession $table, string $type = 'R', string $camp = 'adversaires', int $vilenie = 2): BolFightSessionPnj
    {
        $fiche = BolHeros::create(['nom' => 'Rival', 'joueur' => 'MJ', 'user_id' => $table->user_id, 'type' => $type, 'vilenie' => $vilenie]);

        return app(BolFightSessionService::class)->createPnjRow($table->id, $fiche->id, $camp);
    }

    private function fuite(BolFightSession $table, BolFightSessionPnj $ligne)
    {
        return $this->patchJson("/api/bol/fight-session/{$table->id}/combatant/pnj/{$ligne->id}/fuite");
    }

    public function test_un_rival_adverse_depense_un_point_de_vilenie_et_quitte_le_combat(): void
    {
        $table = $this->table();
        $ligne = $this->ligne($table);
        $cle = "pnj-{$ligne->id}";

        $this->fuite($table, $ligne)
            ->assertOk()
            ->assertJsonPath('pnjs.0.vilenie_courante', 1)
            ->assertJsonPath('etat_combat.fuis', [$cle]);

        $this->assertSame(1, $ligne->fresh()->vilenie_courante);
        $etat = $table->fresh()->etat_combat;
        $this->assertSame([$cle], $etat['fuis']);
        $this->assertSame(['creature-4', $cle], $etat['exclus']);
        $this->assertSame(3, $etat['round']);
        $this->assertSame(['hero-1'], $etat['joues']);
    }

    public function test_un_rival_allie_ne_fuit_pas_ainsi(): void
    {
        $table = $this->table();
        $ligne = $this->ligne($table, camp: 'heros');

        $this->fuite($table, $ligne)->assertStatus(422);

        $this->assertInchange($table, $ligne, 2);
    }

    public function test_un_rival_sans_vilenie_ne_fuit_pas(): void
    {
        $table = $this->table();
        $ligne = $this->ligne($table, vilenie: 0);

        $this->fuite($table, $ligne)->assertStatus(422);

        $this->assertInchange($table, $ligne, 0);
    }

    public function test_seul_un_rival_fuit_ainsi(): void
    {
        $table = $this->table();
        $ligne = $this->ligne($table, type: 'C');

        $this->fuite($table, $ligne)->assertStatus(422);

        $this->assertNull($ligne->fresh()->vilenie_courante);
        $this->assertSame([], $table->fresh()->etat_combat['fuis'] ?? []);
    }

    public function test_un_rival_deja_enfui_ne_depense_pas_une_seconde_fois(): void
    {
        $table = $this->table();
        $ligne = $this->ligne($table);

        $this->fuite($table, $ligne)->assertOk();
        $this->fuite($table, $ligne)->assertStatus(422);

        $this->assertSame(1, $ligne->fresh()->vilenie_courante);
        $this->assertSame(["pnj-{$ligne->id}"], $table->fresh()->etat_combat['fuis']);
    }

    public function test_hors_combat_personne_ne_fuit(): void
    {
        $table = $this->table('libre');
        $ligne = $this->ligne($table);

        $this->fuite($table, $ligne)->assertStatus(422);

        $this->assertInchange($table, $ligne, 2);
    }

    public function test_un_autre_compte_ne_fait_pas_fuir_le_rival_d_une_table(): void
    {
        $autre = User::factory()->create();
        $table = $this->table(userId: $autre->id);
        $ligne = $this->ligne($table);

        $this->fuite($table, $ligne)->assertNotFound();

        $this->assertInchange($table, $ligne, 2);
    }

    public function test_une_ligne_d_une_autre_table_est_introuvable(): void
    {
        $table = $this->table();
        $ailleurs = $this->ligne($this->table());

        $this->fuite($table, $ailleurs)->assertNotFound();

        $this->assertSame(2, $ailleurs->fresh()->vilenie_courante);
    }

    /** Un état du combat envoyé ensuite par le front, calculé avant la réponse de la fuite (sans elle), ne fait pas revenir le rival. */
    public function test_un_etat_envoye_sans_la_fuite_ne_fait_pas_revenir_le_rival(): void
    {
        $table = $this->table();
        $ligne = $this->ligne($table);
        $cle = "pnj-{$ligne->id}";
        $this->fuite($table, $ligne)->assertOk();

        $this->patchJson("/api/bol/fight-session/{$table->id}/etat-combat", ['round' => 3, 'joues' => ['hero-1', 'pnj-9'], 'exclus' => ['creature-4'], 'fuis' => []])
            ->assertOk();

        $etat = $table->fresh()->etat_combat;
        $this->assertSame([$cle], $etat['fuis']);
        $this->assertContains($cle, $etat['exclus']);
        $this->assertSame(['hero-1', 'pnj-9'], $etat['joues']);
    }

    private function assertInchange(BolFightSession $table, BolFightSessionPnj $ligne, int $vilenie): void
    {
        $this->assertSame($vilenie, $ligne->fresh()->vilenie_courante);
        $etat = $table->fresh()->etat_combat;
        $this->assertSame([], $etat['fuis'] ?? []);
        $this->assertSame(['creature-4'], $etat['exclus']);
    }
}
