<?php

namespace Tests\Feature;

use App\Http\Services\Cpr\CprReferenceCatalogue;
use App\Models\Cpr\CprArmure;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cyberpunk RED : les données de référence ont un id fixe, et `cpr:reference` les réinjecte sans rien perdre. */
class CprReferenceCatalogueTest extends TestCase
{
    use RefreshDatabase;

    public function test_book_rows_carry_the_id_of_their_file(): void
    {
        foreach (array_keys(CprReferenceCatalogue::TABLES) as $table) {
            $fichier = require database_path("data/cpr/{$table}.php");
            $this->assertSame(count($fichier), DB::table($table)->count(), $table);
            foreach ($fichier as $ligne) {
                if (isset($ligne['code'])) {
                    $this->assertSame($ligne['id'], (int) DB::table($table)->where('code', $ligne['code'])->value('id'), "{$table} {$ligne['code']}");
                }
            }
        }
        $this->assertSame(2, (int) DB::table('cpr_role')->where('code', 'solo')->value('id'));
    }

    public function test_an_item_of_an_account_takes_an_id_above_the_book(): void
    {
        $user = User::factory()->create();
        $id = DB::table('cpr_armure')->insertGetId(['user_id' => $user->id, 'nom' => 'Blouson maison', 'type' => 'armure', 'pa' => 5, 'prix' => 30]);

        $this->assertGreaterThanOrEqual(CprReferenceCatalogue::ID_DES_COMPTES, $id);
    }

    public function test_reinjecting_restores_the_book_without_touching_sheets_or_accounts(): void
    {
        $user = User::factory()->create();
        $cuir = (int) DB::table('cpr_armure')->where('code', 'cuir')->value('id');
        $kevlar = (int) DB::table('cpr_armure')->where('code', 'kevlar')->value('id');
        Sanctum::actingAs($user);
        $fiche = $this->postJson('/api/cpr/personnages', [
            'pseudo' => 'Kelsa', 'armures' => [['armure_id' => $cuir, 'localisation' => 'corps']],
        ])->assertCreated()->json('id');
        $maison = DB::table('cpr_armure')->insertGetId(['user_id' => $user->id, 'nom' => 'Blouson maison', 'type' => 'armure', 'pa' => 5, 'prix' => 30]);
        DB::table('cpr_armure')->insert(['id' => 5000, 'nom' => 'Retirée du livre', 'type' => 'armure', 'pa' => 1, 'prix' => 1]);

        DB::table('cpr_armure')->where('id', $cuir)->update(['nom' => 'Cuir abîmé', 'pa' => 1]);
        DB::table('cpr_armure')->where('id', $kevlar)->delete();

        $this->artisan('cpr:reference', ['tables' => ['cpr_armure']])->assertSuccessful();

        $this->assertSame('Cuir', DB::table('cpr_armure')->where('id', $cuir)->value('nom'));
        $this->assertSame(4, (int) DB::table('cpr_armure')->where('id', $cuir)->value('pa'));
        $this->assertSame('kevlar', DB::table('cpr_armure')->where('id', $kevlar)->value('code'));
        $this->assertSame('Blouson maison', DB::table('cpr_armure')->where('id', $maison)->value('nom'));
        $this->assertTrue(DB::table('cpr_armure')->where('id', 5000)->exists(), 'une ligne hors du fichier est signalée, jamais supprimée');
        $this->assertSame($cuir, (int) DB::table('cpr_personnage_armure')->where('personnage_id', $fiche)->value('armure_id'));
    }

    public function test_the_report_counts_changes_and_rows_out_of_the_file(): void
    {
        DB::table('cpr_armure')->where('code', 'cuir')->update(['prix' => 999]);
        DB::table('cpr_armure')->insert(['id' => 5000, 'nom' => 'Retirée du livre', 'type' => 'armure', 'pa' => 1, 'prix' => 1]);

        $bilan = app(CprReferenceCatalogue::class)->synchroniser(['cpr_armure']);

        $this->assertSame(['ajoutees' => 0, 'modifiees' => 1, 'inchangees' => 8, 'absentes_du_fichier' => [5000]], $bilan['cpr_armure']);
        $this->assertSame(0, app(CprReferenceCatalogue::class)->synchroniser(['cpr_armure'])['cpr_armure']['modifiees']);
    }

    public function test_a_dry_run_writes_nothing(): void
    {
        DB::table('cpr_cyber')->where('code', 'sandevistan')->update(['prix' => 1]);

        $this->artisan('cpr:reference', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(1, (int) DB::table('cpr_cyber')->where('code', 'sandevistan')->value('prix'));
    }

    public function test_an_unknown_table_is_refused(): void
    {
        $this->artisan('cpr:reference', ['tables' => ['bol_heros']])->assertFailed();
    }

    public function test_the_reference_api_sees_a_reinjected_row(): void
    {
        Sanctum::actingAs(User::factory()->create());
        $this->getJson('/api/cpr/reference')->assertOk();
        CprArmure::query()->where('code', 'cuir')->update(['nom' => 'Cuir abîmé']);

        $this->artisan('cpr:reference', ['tables' => ['cpr_armure']])->assertSuccessful();

        $armures = collect($this->getJson('/api/cpr/reference')->json('armures'))->keyBy('code');
        $this->assertSame('Cuir', $armures['cuir']['nom']);
    }
}
