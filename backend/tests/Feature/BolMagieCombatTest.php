<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolFightSessionService;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionPnj;
use App\Models\Bol\BolHeros;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** La foi et la sorcellerie en combat (livre p. 146-157) : un héros dépense les points de foi et de pouvoir de sa fiche, comme son
 * héroïsme ; un PNJ, qui peut être posé en plusieurs exemplaires, les dépense sur sa ligne de table, partie de sa fiche. */
class BolMagieCombatTest extends TestCase
{
    use RefreshDatabase;

    private const MIGRATION = 'migrations/2026_11_03_100000_add_foi_and_pouvoir_to_bol_fight_session_pnj.php';

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    private function fiche(string $type, array $over = [], ?string $userId = null): BolHeros
    {
        return BolHeros::create(['nom' => 'Fiche', 'joueur' => 'MJ', 'user_id' => $userId ?? $this->user->id, 'type' => $type] + $over);
    }

    private function table(?string $userId = null): BolFightSession
    {
        return BolFightSession::create(['titre' => 'Table', 'statut' => 'combat', 'user_id' => $userId ?? $this->user->id]);
    }

    public function test_une_ressource_magique_ne_descend_pas_sous_zero_et_qui_n_en_a_pas_n_en_gagne_pas(): void
    {
        $this->assertSame(3, BolFightSessionService::ressourceInitiale(3));
        $this->assertNull(BolFightSessionService::ressourceInitiale(0));
        $this->assertNull(BolFightSessionService::ressourceInitiale(null));
        $this->assertSame(7, BolFightSessionService::ressourceSuivante(12, -5));
        $this->assertSame(0, BolFightSessionService::ressourceSuivante(2, -5));
        $this->assertNull(BolFightSessionService::ressourceSuivante(null, -1));
    }

    public function test_un_pnj_qui_a_la_carriere_part_de_zero_et_pas_sans_reserve(): void
    {
        $this->assertSame(0, BolFightSessionService::ressourceInitiale(0, true));
        $this->assertSame(0, BolFightSessionService::ressourceInitiale(null, true));
        $this->assertSame(4, BolFightSessionService::ressourceInitiale(4, true));
        $this->assertNull(BolFightSessionService::ressourceInitiale(0, false));
    }

    public function test_un_pretre_sans_points_recoit_un_point_a_la_main(): void
    {
        DB::table('bol_carriere')->insert([['id' => 21, 'carriere' => 'Prêtre'], ['id' => 24, 'carriere' => 'Sorcier'], ['id' => 1, 'carriere' => 'Soldat']]);
        $pretre = $this->fiche('R', ['foi' => 0]);
        $pretre->carrieres()->create(['carriere_id' => 21, 'value' => 1]);
        $sorcier = $this->fiche('C', ['pouvoir' => 0]);
        $sorcier->carrieres()->create(['carriere_id' => 24, 'value' => 0]);
        $soldat = $this->fiche('C');
        $soldat->carrieres()->create(['carriere_id' => 1, 'value' => 2]);
        $table = $this->table();
        $service = app(BolFightSessionService::class);

        $lignePretre = $service->createPnjRow($table->id, $pretre->id, 'adversaires');
        $ligneSorcier = $service->createPnjRow($table->id, $sorcier->id, 'adversaires');
        $ligneSoldat = $service->createPnjRow($table->id, $soldat->id, 'adversaires');

        $this->assertSame(0, $lignePretre->fresh()->foi_courante);
        $this->assertNull($lignePretre->fresh()->pouvoir_courant);
        $this->assertSame(0, $ligneSorcier->fresh()->pouvoir_courant);
        $this->assertNull($ligneSoldat->fresh()->foi_courante);

        $this->patchJson("/api/bol/fight-session/{$table->id}/combatant/pnj/{$lignePretre->id}/ressource", ['ressource' => 'foi', 'delta' => 1])
            ->assertOk();
        $this->assertSame(1, $lignePretre->fresh()->foi_courante);
    }

    public function test_une_ligne_deja_posee_sans_reserve_en_recoit_une_quand_le_mj_en_donne(): void
    {
        // Une ligne remplie par la migration 2026_11_03_100000 avant la correction : un prêtre à 0 point y est resté sans réserve.
        $pretre = $this->fiche('R', ['foi' => 0]);
        $table = $this->table();
        $ligne = app(BolFightSessionService::class)->createPnjRow($table->id, $pretre->id, 'adversaires');
        $ligne->update(['foi_courante' => null]);
        $url = "/api/bol/fight-session/{$table->id}/combatant/pnj/{$ligne->id}/ressource";

        $this->patchJson($url, ['ressource' => 'foi', 'delta' => -1])->assertOk();
        $this->assertNull($ligne->fresh()->foi_courante);
        $this->patchJson($url, ['ressource' => 'foi', 'delta' => 2])->assertOk()->assertJsonPath('pnjs.0.foi_courante', 2);
    }

    public function test_un_pnj_pose_a_la_table_part_de_la_foi_et_du_pouvoir_de_sa_fiche(): void
    {
        $sorcier = $this->fiche('R', ['foi' => 2, 'pouvoir' => 13]);
        $garde = $this->fiche('C');
        $table = $this->table();

        $service = app(BolFightSessionService::class);
        $ligne = $service->createPnjRow($table->id, $sorcier->id, 'adversaires');
        $sans = $service->createPnjRow($table->id, $garde->id, 'adversaires');

        $this->assertSame(2, $ligne->fresh()->foi_courante);
        $this->assertSame(13, $ligne->fresh()->pouvoir_courant);
        $this->assertNull($sans->fresh()->foi_courante);
        $this->assertNull($sans->fresh()->pouvoir_courant);
    }

    public function test_un_pnj_depense_son_pouvoir_sur_sa_ligne_sans_toucher_a_sa_fiche(): void
    {
        $sorcier = $this->fiche('R', ['pouvoir' => 13, 'foi' => 1]);
        $table = $this->table();
        $ligne = app(BolFightSessionService::class)->createPnjRow($table->id, $sorcier->id, 'adversaires');
        $url = "/api/bol/fight-session/{$table->id}/combatant/pnj/{$ligne->id}/ressource";

        $this->patchJson($url, ['ressource' => 'pouvoir', 'delta' => -5])->assertOk()->assertJsonPath('pnjs.0.pouvoir_courant', 8);
        $this->patchJson($url, ['ressource' => 'foi', 'delta' => -3])->assertOk()->assertJsonPath('pnjs.0.foi_courante', 0);
        $this->assertSame(13, $sorcier->fresh()->pouvoir);
        $this->patchJson($url, ['ressource' => 'heroisme', 'delta' => -1])->assertStatus(422);
        $this->patchJson($url, ['ressource' => 'pouvoir', 'delta' => -99])->assertStatus(422);
    }

    public function test_un_autre_compte_ne_touche_pas_au_pouvoir_d_un_pnj_de_la_table(): void
    {
        $autre = User::factory()->create();
        $sorcier = $this->fiche('R', ['pouvoir' => 13], $autre->id);
        $table = $this->table($autre->id);
        $ligne = app(BolFightSessionService::class)->createPnjRow($table->id, $sorcier->id, 'adversaires');

        $this->patchJson("/api/bol/fight-session/{$table->id}/combatant/pnj/{$ligne->id}/ressource", ['ressource' => 'pouvoir', 'delta' => -5])->assertNotFound();
        $this->assertSame(13, $ligne->fresh()->pouvoir_courant);
    }

    public function test_un_heros_depense_la_foi_et_le_pouvoir_de_sa_fiche(): void
    {
        $pretre = $this->fiche('H', ['foi' => 2, 'pouvoir' => 11]);

        $this->patchJson("/api/bol/heros/{$pretre->id}/ressource", ['ressource' => 'foi', 'delta' => -1])->assertOk()->assertJsonPath('ressources.foi', 1);
        $this->patchJson("/api/bol/heros/{$pretre->id}/ressource", ['ressource' => 'pouvoir', 'delta' => -12])->assertOk()->assertJsonPath('ressources.pouvoir', 0);
        $this->patchJson("/api/bol/heros/{$pretre->id}/ressource", ['ressource' => 'vitalite', 'delta' => 1])->assertStatus(422);
    }

    public function test_un_autre_compte_ne_touche_pas_a_la_foi_d_un_heros(): void
    {
        $autre = User::factory()->create();
        $pretre = $this->fiche('H', ['foi' => 2], $autre->id);

        $this->patchJson("/api/bol/heros/{$pretre->id}/ressource", ['ressource' => 'foi', 'delta' => -1])->assertNotFound();
        $this->assertSame(2, $pretre->fresh()->foi);
    }

    public function test_la_migration_pose_les_colonnes_et_les_remplit_d_apres_la_fiche(): void
    {
        $migration = require database_path(self::MIGRATION);
        $sorcier = $this->fiche('R', ['foi' => 1, 'pouvoir' => 12]);
        $garde = $this->fiche('C');
        $table = $this->table();
        $migration->down();
        $this->assertFalse(Schema::hasColumn('bol_fight_session_pnj', 'pouvoir_courant'));
        $copie = ['fight_session_id' => $table->id, 'camp' => 'adversaires', 'rang' => 'rival', 'nom' => 'X', 'vigueur' => 0, 'agilite' => 0, 'esprit' => 0, 'aura' => 0, 'melee' => 0, 'tir' => 0, 'defense' => 0, 'vitalite_max' => 10, 'vitalite_courante' => 10];
        $avec = DB::table('bol_fight_session_pnj')->insertGetId(['pnj_id' => $sorcier->id] + $copie);
        $sans = DB::table('bol_fight_session_pnj')->insertGetId(['pnj_id' => $garde->id] + $copie);

        $migration->up();

        $this->assertSame(12, BolFightSessionPnj::find($avec)->pouvoir_courant);
        $this->assertSame(1, BolFightSessionPnj::find($avec)->foi_courante);
        $this->assertNull(BolFightSessionPnj::find($sans)->pouvoir_courant);
        $migration->up();
        $this->assertTrue(Schema::hasColumn('bol_fight_session_pnj', 'foi_courante'));
    }
}
