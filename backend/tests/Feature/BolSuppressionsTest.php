<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolFightSessionService;
use App\Models\Bol\BolCompagnie;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionHeros;
use App\Models\Bol\BolFightSessionPnj;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolImportRef;
use App\Models\Bol\BolSaga;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScene;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Supprimer une chose ne laisse rien derrière elle qui la cite : ni ligne, ni référence d'import, ni identifiant rangé dans un JSON. */
class BolSuppressionsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_a_deleted_pnj_leaves_the_scenes_and_the_import_refs_but_stays_on_the_tables(): void
    {
        $pnj = BolHeros::create(['nom' => 'Garde', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'C']);
        $autre = BolHeros::create(['nom' => 'Aubergiste', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'C']);
        $scene = $this->scene(null, 'La taverne', [$this->entree('pnj', $pnj->id), $this->entree('pnj', $autre->id)]);
        $this->ref('pnj', $pnj->id);
        $partie = $this->partie(null);
        $ligne = BolFightSessionPnj::create(['fight_session_id' => $partie->id, 'pnj_id' => $pnj->id, 'camp' => 'adversaires', 'rang' => 'coriace', 'nom' => 'Garde', 'vigueur' => 0, 'agilite' => 0, 'esprit' => 0, 'aura' => 0, 'melee' => 0, 'tir' => 0, 'defense' => 0, 'vitalite_courante' => 8, 'vitalite_max' => 8]);

        $this->deleteJson("/api/bol/pnj/delete/{$pnj->id}")->assertOk();

        $this->assertSame([$autre->id], array_column($scene->fresh()->distribution, 'source_id'));
        $this->assertSame(0, BolImportRef::count());
        $this->assertNull($ligne->fresh()->pnj_id);
        $this->assertSame('Garde', $ligne->fresh()->nom);
    }

    public function test_a_deleted_creature_leaves_the_scenes_and_the_import_refs_but_stays_on_the_tables(): void
    {
        $creature = BolCreature::create(['nom' => 'Rat', 'user_id' => $this->user->id]);
        $scene = $this->scene(null, 'La cave', [$this->entree('creature', $creature->id)]);
        $this->ref('creature', $creature->id);
        $partie = $this->partie(null);
        $ligne = app(BolFightSessionService::class)->createCreatureRow($partie->id, $creature->id, 'adversaires');

        $this->deleteJson("/api/bol/creature/delete/{$creature->id}")->assertOk();

        $this->assertSame([], $scene->fresh()->distribution);
        $this->assertSame(0, BolImportRef::count());
        $this->assertNull($ligne->fresh()->creature_id);
    }

    public function test_a_deleted_demon_leaves_the_scenes_and_the_import_refs(): void
    {
        $demon = BolDemon::create(['nom' => 'Xothar', 'user_id' => $this->user->id]);
        $scene = $this->scene(null, 'Le temple', [$this->entree('demon', $demon->id)]);
        $this->ref('demon', $demon->id);

        $this->deleteJson("/api/bol/demon/delete/{$demon->id}")->assertOk();

        $this->assertSame([], $scene->fresh()->distribution);
        $this->assertSame(0, BolImportRef::count());
    }

    /** Une créature et un PNJ peuvent porter le même identifiant de scène ? Non, mais une entrée d'une autre sorte ne doit pas partir. */
    public function test_deleting_a_sheet_keeps_the_entries_of_other_kinds(): void
    {
        $creature = BolCreature::create(['nom' => 'Rat', 'user_id' => $this->user->id]);
        $scene = $this->scene(null, 'La cave', [$this->entree('creature', $creature->id), $this->entree('demon', $creature->id)]);

        $this->deleteJson("/api/bol/creature/delete/{$creature->id}")->assertOk();

        $this->assertSame(['demon'], array_column($scene->fresh()->distribution, 'kind'));
    }

    public function test_a_deleted_scene_leaves_the_clues_of_the_others_and_its_import_ref_and_the_table(): void
    {
        $cible = $this->scene(null, 'La cave', []);
        $source = BolScene::create(['user_id' => $this->user->id, 'titre' => 'La taverne', 'ordre' => 0, 'distribution' => [], 'pistes' => [
            ['texte' => 'Un bruit en bas', 'scene_id' => $cible->id],
            ['texte' => 'Une rumeur', 'scene_id' => null],
        ]]);
        $this->ref('scene', $cible->id);
        $partie = $this->partie(null);
        $partie->update(['scene_id' => $cible->id]);

        $this->deleteJson("/api/bol/scene/delete/{$cible->id}")->assertOk();

        $this->assertSame([
            ['texte' => 'Un bruit en bas', 'scene_id' => null],
            ['texte' => 'Une rumeur', 'scene_id' => null],
        ], $source->fresh()->pistes);
        $this->assertSame(0, BolImportRef::count());
        $this->assertNull($partie->fresh()->scene_id);
    }

    /** Elle redeviendrait improvisée sans que personne l'ait demandé. */
    public function test_a_chapter_a_partie_is_on_cannot_be_deleted(): void
    {
        [$chapitre] = $this->saga('Perle du Beshaar', 1);
        $scene = $this->scene($chapitre->id, 'La taverne', []);
        $partie = $this->partie($chapitre->id);

        $this->deleteJson("/api/bol/scenario/delete/{$chapitre->id}")->assertStatus(409);

        $this->assertSame($chapitre->id, $partie->fresh()->scenario_id);
        $this->assertNotNull($scene->fresh());
    }

    public function test_a_deleted_chapter_takes_its_scenes_and_refs_and_leaves_the_memory_of_the_parties(): void
    {
        [$ch1, $ch2] = $this->saga('Perle du Beshaar', 2);
        $scene = $this->scene($ch1->id, 'La taverne', []);
        $ailleurs = $this->scene($ch2->id, 'Le désert', []);
        $this->ref('scenario', $ch1->id);
        $this->ref('scene', $scene->id);
        $partie = $this->partie($ch2->id);
        $partie->update(['chapitres_quittes' => [$ch1->id, $ch2->id]]);

        $this->deleteJson("/api/bol/scenario/delete/{$ch1->id}")->assertOk();

        $this->assertNull(BolScenario::find($ch1->id));
        $this->assertNull(BolScene::find($scene->id));
        $this->assertNotNull(BolScene::find($ailleurs->id));
        $this->assertSame(0, BolImportRef::count());
        $this->assertSame([$ch2->id], $partie->fresh()->chapitres_quittes);
        $this->assertSame(1, BolSaga::count());
    }

    public function test_a_scenario_stays_empty_when_its_last_chapter_goes(): void
    {
        [$chapitre] = $this->saga('Perle du Beshaar', 1);

        $this->deleteJson("/api/bol/scenario/delete/{$chapitre->id}")->assertOk();

        $this->assertSame(['Perle du Beshaar'], BolSaga::pluck('titre')->all());
    }

    /** Renommer un chapitre peut le ranger ailleurs : le scénario qu'il quitte reste, vide. */
    public function test_a_scenario_stays_empty_when_its_last_chapter_moves_elsewhere(): void
    {
        [$chapitre] = $this->saga('Perle du Beshaar', 1);

        $this->postJson('/api/bol/scenario/update', ['id' => $chapitre->id, 'titre' => 'Le Dieu voilé — 1. La fuite'])->assertOk();

        $this->assertEqualsCanonicalizing(['Perle du Beshaar', 'Le Dieu voilé'], BolSaga::pluck('titre')->all());
    }

    /** Sa ligne de table disparaîtrait en plein combat. */
    public function test_a_hero_cannot_be_deleted_during_a_combat(): void
    {
        $axel = BolHeros::create(['nom' => 'Axel', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'H']);
        $partie = $this->partie(null);
        BolFightSessionHeros::create(['fight_session_id' => $partie->id, 'heros_id' => $axel->id, 'camp' => 'heros']);
        $partie->update(['statut' => 'combat']);

        $this->deleteJson("/api/bol/heros/delete/{$axel->id}")->assertStatus(409);

        $this->assertNotNull(BolHeros::find($axel->id));
        $this->assertSame(1, BolFightSessionHeros::count());
    }

    public function test_a_deleted_hero_leaves_his_companies_and_tables(): void
    {
        $axel = BolHeros::create(['nom' => 'Axel', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'H']);
        $compagnie = BolCompagnie::create(['nom' => 'Les Lames', 'user_id' => $this->user->id]);
        $compagnie->heros()->sync([$axel->id]);
        $partie = $this->partie(null);
        BolFightSessionHeros::create(['fight_session_id' => $partie->id, 'heros_id' => $axel->id, 'camp' => 'heros']);

        $this->deleteJson("/api/bol/heros/delete/{$axel->id}")->assertOk();

        $this->assertSame(0, $compagnie->heros()->count());
        $this->assertSame(0, BolFightSessionHeros::count());
    }

    /** Une compagnie a pu perdre tous ses héros, supprimés : elle ne lance pas de partie vide. */
    public function test_a_company_without_heroes_cannot_start_a_partie(): void
    {
        $compagnie = BolCompagnie::create(['nom' => 'Les Lames', 'user_id' => $this->user->id]);
        [$chapitre] = $this->saga('Perle du Beshaar', 1);

        $this->postJson('/api/bol/fight-session/create', ['compagnie_id' => $compagnie->id, 'scenario_id' => $chapitre->id])->assertStatus(422);

        $this->assertSame(0, BolFightSession::count());
    }

    public function test_a_deleted_company_keeps_its_heroes_in_the_library(): void
    {
        $axel = BolHeros::create(['nom' => 'Axel', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'H']);
        $compagnie = BolCompagnie::create(['nom' => 'Les Lames', 'user_id' => $this->user->id]);
        $compagnie->heros()->sync([$axel->id]);

        $this->deleteJson("/api/bol/compagnie/delete/{$compagnie->id}")->assertOk();

        $this->assertNotNull(BolHeros::find($axel->id));
        $this->assertSame(0, DB::table('bol_compagnie_heros')->count());
    }

    /** Toutes les fiches d'un compte partent avec lui ; le catalogue public, à personne, reste. */
    public function test_deleting_an_account_takes_all_its_sheets(): void
    {
        BolHeros::create(['nom' => 'Axel', 'joueur' => 'J', 'user_id' => $this->user->id, 'type' => 'H']);
        BolCreature::create(['nom' => 'Rat', 'user_id' => $this->user->id]);
        BolDemon::create(['nom' => 'Xothar', 'user_id' => $this->user->id]);
        BolCreature::create(['nom' => 'Loup du catalogue', 'user_id' => null]);

        $this->user->delete();

        $this->assertSame(0, BolHeros::count());
        $this->assertSame(0, BolDemon::count());
        $this->assertSame(['Loup du catalogue'], BolCreature::pluck('nom')->all());
    }

    /** @return array<int, BolScenario> les chapitres 1 à `$n` d'une saga du compte */
    private function saga(string $titre, int $n): array
    {
        $saga = BolSaga::create(['user_id' => $this->user->id, 'titre' => $titre]);

        return array_map(
            fn (int $numero) => BolScenario::create(['user_id' => $this->user->id, 'saga_id' => $saga->id, 'numero' => $numero, 'titre' => "Chapitre $numero"]),
            range(1, $n),
        );
    }

    /** @param array<int, array<string, mixed>> $distribution */
    private function scene(?string $chapitre, string $titre, array $distribution): BolScene
    {
        return BolScene::create(['user_id' => $this->user->id, 'scenario_id' => $chapitre, 'titre' => $titre, 'ordre' => 0, 'distribution' => $distribution]);
    }

    /** @return array<string, mixed> */
    private function entree(string $kind, string $id): array
    {
        return ['kind' => $kind, 'source_id' => $id, 'qty' => 1, 'camp' => 'adversaires'];
    }

    private function partie(?string $chapitre): BolFightSession
    {
        return BolFightSession::create(['titre' => 'Les Lames', 'statut' => 'libre', 'user_id' => $this->user->id, 'scenario_id' => $chapitre, 'jouee_le' => now()]);
    }

    private function ref(string $kind, string $id): void
    {
        BolImportRef::create(['user_id' => $this->user->id, 'saga' => 'perle', 'type' => $kind === 'scene' ? BolImportRef::TYPE_SCENE : BolImportRef::TYPE_PERSONNAGE, 'cle' => "$kind-$id", 'entity_kind' => $kind, 'entity_id' => $id]);
    }
}
