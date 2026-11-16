<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolPortraits;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolImportRef;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** Les portraits des fiches importées sortent nommés par leur clé, pour être reposés sur un autre poste par `bol:import-portraits`. */
class BolExportPortraitsTest extends TestCase
{
    use RefreshDatabase;

    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    private User $user;

    private string $dir;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->user = User::factory()->create(['email' => 'mj@example.com']);
        $this->dir = sys_get_temp_dir() . '/bol-export-' . uniqid();
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->dir);

        parent::tearDown();
    }

    public function test_each_imported_sheet_portrait_is_written_under_its_saga_and_key(): void
    {
        $url = BolPortraits::store('data:image/png;base64,' . self::PNG);
        $this->pnj('dieu-voile', 'lok-kozaar', $url);
        $creature = BolCreature::create(['nom' => 'Macaque', 'user_id' => $this->user->id, 'id_taille' => 1]);
        DB::table('bol_creature')->where('id', $creature->id)->update(['avatar' => $url]);
        $this->ref('dieu-voile', 'ch5-macaque-hurleur', 'creature', $creature->id);
        $this->pnj('dieu-voile', 'sans-portrait');

        $this->exporter()->assertSuccessful();

        $this->assertSame(['dieu-voile--ch5-macaque-hurleur.png', 'dieu-voile--lok-kozaar.png'], $this->fichiers());
        $this->assertSame(base64_decode(self::PNG), File::get($this->dir . '/dieu-voile--lok-kozaar.png'));
    }

    public function test_the_catalogue_another_account_and_non_file_portraits_are_not_written(): void
    {
        $url = BolPortraits::store('data:image/png;base64,' . self::PNG);
        $catalogue = BolHeros::create(['nom' => 'Sergent du guet', 'joueur' => '', 'user_id' => null, 'type' => 'C']);
        DB::table('bol_heros')->where('id', $catalogue->id)->update(['avatar' => $url]);
        $this->ref('dieu-voile', 'ch2-soldat', 'pnj', $catalogue->id);
        $this->pnj('dieu-voile', 'autre', $url, User::factory()->create());
        $this->pnj('perle-du-beshaar', 'livre', '/assets/bol/livre.jpg');

        $this->exporter()->expectsOutputToContain('perle-du-beshaar--livre')->assertSuccessful();

        $this->assertSame([], $this->fichiers());
    }

    public function test_hand_made_sheets_with_a_portrait_are_named_for_the_app(): void
    {
        $url = BolPortraits::store('data:image/png;base64,' . self::PNG);
        $heros = BolHeros::create(['nom' => 'Conan', 'joueur' => 'Lionel', 'user_id' => $this->user->id, 'type' => 'H']);
        DB::table('bol_heros')->where('id', $heros->id)->update(['avatar' => $url]);

        $this->exporter()->expectsOutputToContain('Conan')->assertSuccessful();

        $this->assertSame([], $this->fichiers());
    }

    public function test_what_is_exported_from_one_account_is_imported_on_another_by_its_keys(): void
    {
        $url = BolPortraits::store('data:image/png;base64,' . self::PNG);
        $this->pnj('dieu-voile', 'lok-kozaar', $url);
        User::factory()->create(['email' => 'ailleurs@example.com']);
        $ailleurs = User::where('email', 'ailleurs@example.com')->first();
        $sonPnj = $this->pnj('dieu-voile', 'lok-kozaar', null, $ailleurs);

        $this->exporter()->assertSuccessful();
        $this->artisan('bol:import-portraits', ['dossier' => $this->dir, '--user' => 'ailleurs@example.com'])->assertSuccessful();

        $this->assertSame($url, $sonPnj->fresh()->avatar);
    }

    public function test_the_account_is_required(): void
    {
        $this->artisan('bol:export-portraits', ['dossier' => $this->dir])->assertFailed();
    }

    private function exporter(): \Illuminate\Testing\PendingCommand
    {
        return $this->artisan('bol:export-portraits', ['dossier' => $this->dir, '--user' => 'mj@example.com']);
    }

    /** @return list<string> */
    private function fichiers(): array
    {
        $noms = array_map('basename', File::files($this->dir));
        sort($noms);

        return $noms;
    }

    private function pnj(string $saga, string $cle, ?string $avatar = null, ?User $owner = null): BolHeros
    {
        $owner ??= $this->user;
        $pnj = BolHeros::create(['nom' => $cle, 'joueur' => '', 'user_id' => $owner->id, 'type' => 'C']);
        if ($avatar !== null) {
            DB::table('bol_heros')->where('id', $pnj->id)->update(['avatar' => $avatar]);
        }
        $this->ref($saga, $cle, 'pnj', $pnj->id, $owner);

        return $pnj;
    }

    private function ref(string $saga, string $cle, string $kind, string|int $id, ?User $owner = null): void
    {
        BolImportRef::create([
            'user_id' => ($owner ?? $this->user)->id,
            'saga' => $saga,
            'type' => BolImportRef::TYPE_PERSONNAGE,
            'cle' => $cle,
            'entity_kind' => $kind,
            'entity_id' => (string) $id,
        ]);
    }
}
