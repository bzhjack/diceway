<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolCache;
use App\Http\Services\Bol\BolPortraits;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolImportRef;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** Les portraits générés pour une saga se posent d'un coup, chacun sur la fiche que désigne sa clé d'import. */
class BolImportPortraitsTest extends TestCase
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
        $this->dir = sys_get_temp_dir() . '/bol-portraits-' . uniqid();
        File::makeDirectory($this->dir);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->dir);

        parent::tearDown();
    }

    public function test_a_file_named_after_its_key_becomes_the_portrait_of_the_sheet(): void
    {
        $pnj = $this->pnj('dieu-voile', 'lok-kozaar');
        $this->image('lok-kozaar.png');

        $this->importPortraits(['--saga' => 'dieu-voile'])->assertSuccessful();

        $url = $pnj->fresh()->avatar;
        $this->assertStringStartsWith(BolPortraits::ROUTE, $url);
        Storage::disk('public')->assertExists('portraits/' . basename($url));
    }

    public function test_the_saga_can_be_given_by_the_file_name(): void
    {
        $pnj = $this->pnj('cl1-mariage-amer', 'pretre');
        $other = $this->pnj('cl1-les-trois-coffres', 'pretre');
        $this->image('cl1-mariage-amer--pretre.png');

        $this->importPortraits()->assertSuccessful();

        $this->assertStringStartsWith(BolPortraits::ROUTE, $pnj->fresh()->avatar);
        $this->assertNull($other->fresh()->avatar);
    }

    public function test_a_sheet_that_has_a_portrait_keeps_it_unless_forced(): void
    {
        $pnj = $this->pnj('dieu-voile', 'jia', '/assets/bol/livre.jpg');
        $this->image('jia.png');

        $this->importPortraits(['--saga' => 'dieu-voile'])->assertSuccessful();
        $this->assertSame('/assets/bol/livre.jpg', $pnj->fresh()->avatar);

        $this->importPortraits(['--saga' => 'dieu-voile', '--force' => true])->assertSuccessful();
        $this->assertStringStartsWith(BolPortraits::ROUTE, $pnj->fresh()->avatar);
    }

    public function test_a_key_that_points_to_the_catalogue_is_left_alone(): void
    {
        $catalogue = BolHeros::create(['nom' => 'Sergent du guet', 'joueur' => '', 'user_id' => null, 'type' => 'C']);
        $this->ref('dieu-voile', 'ch2-soldat', 'pnj', $catalogue->id);
        $this->image('ch2-soldat.png');

        $this->importPortraits(['--saga' => 'dieu-voile'])->assertSuccessful();

        $this->assertNull($catalogue->fresh()->avatar);
    }

    public function test_another_account_imports_are_not_touched(): void
    {
        $someoneElse = User::factory()->create();
        $theirs = $this->pnj('dieu-voile', 'lok-kozaar', null, $someoneElse);
        $this->image('lok-kozaar.png');

        $this->importPortraits(['--saga' => 'dieu-voile'])->assertFailed();

        $this->assertNull($theirs->fresh()->avatar);
    }

    public function test_unknown_keys_unreadable_images_and_missing_sagas_are_reported(): void
    {
        $pnj = $this->pnj('dieu-voile', 'qirmar');
        $this->image('qirmar.png');
        $this->image('inconnu.png');
        File::put($this->dir . '/maben.png', 'pas une image');

        $this->importPortraits(['--saga' => 'dieu-voile'])
            ->expectsOutputToContain('inconnu.png')
            ->expectsOutputToContain('maben.png')
            ->assertFailed();
        $this->assertStringStartsWith(BolPortraits::ROUTE, $pnj->fresh()->avatar);

        $this->importPortraits()->expectsOutputToContain('--saga')->assertFailed();
    }

    public function test_a_creature_gets_its_portrait_and_the_cached_list_is_dropped(): void
    {
        $creature = BolCreature::create(['nom' => 'Bête', 'user_id' => $this->user->id, 'id_taille' => 1]);
        $this->ref('dieu-voile', 'ch5-macaque-hurleur', 'creature', $creature->id);
        $this->image('ch5-macaque-hurleur.png');
        Cache::put(BolCache::creatures($this->user->id), ['ancienne liste'], BolCache::TTL);

        $this->importPortraits(['--saga' => 'dieu-voile'])->assertSuccessful();

        $this->assertStringStartsWith(BolPortraits::ROUTE, $creature->fresh()->avatar);
        $this->assertFalse(Cache::has(BolCache::creatures($this->user->id)));
    }

    public function test_a_dry_run_writes_nothing(): void
    {
        $pnj = $this->pnj('dieu-voile', 'lok-kozaar');
        $this->image('lok-kozaar.png');

        $this->importPortraits(['--saga' => 'dieu-voile', '--dry-run' => true])->assertSuccessful();

        $this->assertNull($pnj->fresh()->avatar);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_the_account_is_required(): void
    {
        $this->artisan('bol:import-portraits', ['dossier' => $this->dir])->assertFailed();
    }

    private function importPortraits(array $options = []): \Illuminate\Testing\PendingCommand
    {
        return $this->artisan('bol:import-portraits', ['dossier' => $this->dir, '--user' => 'mj@example.com', ...$options]);
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

    private function image(string $name): void
    {
        File::put($this->dir . '/' . $name, base64_decode(self::PNG));
    }
}
