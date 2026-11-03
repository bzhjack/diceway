<?php

namespace Tests\Feature;

use App\Http\Services\Bol\BolPortraits;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolHeros;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Les portraits voyagent par leur adresse : un fichier, plus un long texte en base64 dans chaque réponse. */
class BolPortraitTest extends TestCase
{
    use RefreshDatabase;

    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    private const DATA_URL = 'data:image/png;base64,' . self::PNG;

    private const OTHER_DATA_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    public function test_an_uploaded_image_becomes_a_file_and_the_sheet_keeps_its_address(): void
    {
        $hero = $this->hero();

        $hero->update(['avatar' => self::DATA_URL]);

        $url = $hero->fresh()->avatar;
        $this->assertMatchesRegularExpression('~^/api/bol/portraits/[0-9a-f]{64}\.png$~', $url);
        Storage::disk('public')->assertExists('portraits/' . basename($url));
        $this->assertSame(self::PNG, base64_encode(Storage::disk('public')->get('portraits/' . basename($url))));
    }

    public function test_the_api_answers_with_the_address_not_the_image(): void
    {
        $hero = $this->hero(self::DATA_URL);

        $response = $this->getJson("/api/bol/heros/{$hero->id}")->assertOk();

        $this->assertSame($hero->fresh()->avatar, $response->json('origines.avatar'));
        $this->assertStringNotContainsString(self::PNG, $response->getContent());
    }

    public function test_an_image_carried_by_two_sheets_is_written_once(): void
    {
        $first = $this->hero(self::DATA_URL);
        $second = $this->hero(self::DATA_URL);

        $this->assertSame($first->avatar, $second->avatar);
        $this->assertCount(1, Storage::disk('public')->files('portraits'));
    }

    public function test_every_kind_of_sheet_stores_its_portrait_as_a_file(): void
    {
        $creature = BolCreature::create(['nom' => 'Bête', 'user_id' => $this->user->id, 'id_taille' => 1, 'avatar' => self::DATA_URL]);

        $this->assertStringStartsWith(BolPortraits::ROUTE, $creature->avatar);
    }

    public function test_saving_a_hero_sheet_turns_the_new_portrait_into_a_file(): void
    {
        $hero = $this->hero();

        // Comme le formulaire l'envoie : nom et joueur aussi à la racine, que la validation des héros (`BolHerosRequest`) exige.
        $response = $this->postJson('/api/bol/heros/update', [
            'id' => $hero->id,
            'nom' => 'Fiche',
            'joueur' => 'Joueur',
            'active' => true,
            'attributs' => ['vigueur' => 1, 'agilite' => 1, 'esprit' => 1, 'aura' => 1],
            'combat' => ['initiative' => 1, 'melee' => 1, 'tir' => 1, 'defense' => 1],
            'origines' => ['joueur' => 'Joueur', 'nom' => 'Fiche', 'region_id' => null, 'avatar' => self::DATA_URL, 'commentaire' => null],
            'ressources' => ['vitalite' => 1, 'heroisme' => 1, 'foi' => 0, 'pouvoir' => 0, 'creation' => 0],
        ])->assertOk();

        $this->assertStringStartsWith(BolPortraits::ROUTE, $response->json('origines.avatar'));
        $this->assertStringStartsWith(BolPortraits::ROUTE, DB::table('bol_heros')->where('id', $hero->id)->value('avatar'));
    }

    public function test_saving_a_pnj_turns_the_new_portrait_into_a_file(): void
    {
        $response = $this->postJson('/api/bol/pnj/create', [
            'nom' => 'Garde', 'joueur' => 'master', 'type' => 'P', 'avatar' => self::DATA_URL,
            'armes' => [], 'armures' => [], 'carrieres' => [], 'traits' => [],
        ])->assertOk();

        $this->assertStringStartsWith(BolPortraits::ROUTE, $response->json('origines.avatar'));
    }

    public function test_an_address_sent_back_by_the_browser_stays_relative(): void
    {
        $url = $this->hero(self::DATA_URL)->avatar;

        $this->assertSame($url, BolPortraits::normalize($url));
        $this->assertSame($url, BolPortraits::normalize('https://api.diceway.com' . $url));
    }

    public function test_what_is_not_an_uploaded_image_does_not_change(): void
    {
        foreach ([null, '', '/assets/bol/empty-avatar.jpg', 'https://exemple.fr/a.png', 'data:image/png;base64,pas-une-image', 'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>')] as $value) {
            $this->assertSame($value, BolPortraits::normalize($value));
        }
        $this->assertSame([], Storage::disk('public')->files('portraits'));
    }

    public function test_a_portrait_is_served_without_a_token_and_cached_for_good(): void
    {
        $url = $this->hero(self::DATA_URL)->avatar;
        $this->app['auth']->forgetGuards();

        $response = $this->get($url)->assertOk();

        $response->assertHeader('Content-Type', 'image/png');
        $this->assertStringContainsString('immutable', $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('max-age=31536000', $response->headers->get('Cache-Control'));
        $this->assertSame(self::PNG, base64_encode(file_get_contents($response->getFile()->getPathname())));
    }

    public function test_only_portrait_files_can_be_asked_for(): void
    {
        $this->get('/api/bol/portraits/' . str_repeat('a', 64) . '.png')->assertNotFound();
        $this->get('/api/bol/portraits/secret.txt')->assertNotFound();
        $this->get('/api/bol/portraits/..%2F..%2F.env')->assertNotFound();
    }

    public function test_extraction_turns_stored_images_into_files(): void
    {
        $hero = $this->legacyHero(self::DATA_URL);
        $untouched = $this->legacyHero('/assets/bol/empty-avatar.jpg');
        $unreadable = $this->legacyHero('data:image/png;base64,pas-une-image');
        $updatedAt = DB::table('bol_heros')->where('id', $hero)->value('updated_at');

        $this->artisan('bol:extract-portraits')->assertSuccessful();

        $url = DB::table('bol_heros')->where('id', $hero)->value('avatar');
        $this->assertStringStartsWith(BolPortraits::ROUTE, $url);
        Storage::disk('public')->assertExists('portraits/' . basename($url));
        $this->assertSame($updatedAt, DB::table('bol_heros')->where('id', $hero)->value('updated_at'));
        $this->assertSame('/assets/bol/empty-avatar.jpg', DB::table('bol_heros')->where('id', $untouched)->value('avatar'));
        $this->assertSame('data:image/png;base64,pas-une-image', DB::table('bol_heros')->where('id', $unreadable)->value('avatar'));
    }

    public function test_extraction_can_be_run_again(): void
    {
        $hero = $this->legacyHero(self::DATA_URL);

        $this->artisan('bol:extract-portraits')->assertSuccessful();
        $url = DB::table('bol_heros')->where('id', $hero)->value('avatar');
        $this->artisan('bol:extract-portraits')->assertSuccessful();

        $this->assertSame($url, DB::table('bol_heros')->where('id', $hero)->value('avatar'));
        $this->assertCount(1, Storage::disk('public')->files('portraits'));
    }

    public function test_a_dry_run_writes_nothing(): void
    {
        $hero = $this->legacyHero(self::DATA_URL);

        $this->artisan('bol:extract-portraits', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(self::DATA_URL, DB::table('bol_heros')->where('id', $hero)->value('avatar'));
        $this->assertSame([], Storage::disk('public')->files('portraits'));
    }

    public function test_the_originals_are_no_longer_kept_aside(): void
    {
        $this->assertFalse(Schema::hasTable('bol_portrait_backup'));
        $options = \Illuminate\Support\Facades\Artisan::all()['bol:extract-portraits']->getDefinition();
        $this->assertFalse($options->hasOption('restore'));
        $this->assertFalse($options->hasOption('forget-originals'));
    }

    public function test_pruning_removes_the_file_of_a_replaced_portrait_and_keeps_the_current_one(): void
    {
        $hero = $this->hero(self::DATA_URL);
        $old = basename($hero->avatar);
        $hero->update(['avatar' => self::OTHER_DATA_URL]);
        $this->travel(2)->days();

        $this->artisan('bol:prune-portraits')->assertSuccessful();

        Storage::disk('public')->assertMissing('portraits/' . $old);
        Storage::disk('public')->assertExists('portraits/' . basename($hero->fresh()->avatar));
    }

    public function test_pruning_removes_the_file_of_a_deleted_sheet_only_once_nobody_carries_it(): void
    {
        $first = $this->hero(self::DATA_URL);
        $second = $this->hero(self::DATA_URL);
        $file = 'portraits/' . basename($first->avatar);
        $first->delete();
        $this->travel(2)->days();

        $this->artisan('bol:prune-portraits')->assertSuccessful();
        Storage::disk('public')->assertExists($file);

        $second->delete();
        $this->artisan('bol:prune-portraits')->assertSuccessful();
        Storage::disk('public')->assertMissing($file);
    }

    public function test_pruning_keeps_every_kind_of_sheet(): void
    {
        $creature = BolCreature::create(['nom' => 'Bête', 'user_id' => $this->user->id, 'id_taille' => 1, 'avatar' => self::DATA_URL]);
        $this->travel(2)->days();

        $this->artisan('bol:prune-portraits')->assertSuccessful();

        Storage::disk('public')->assertExists('portraits/' . basename($creature->avatar));
    }

    public function test_pruning_leaves_a_recent_file_and_what_is_not_a_portrait(): void
    {
        $recent = $this->hero(self::DATA_URL);
        $file = 'portraits/' . basename($recent->avatar);
        $recent->delete();
        Storage::disk('public')->put('portraits/lisez-moi.txt', 'à garder');

        $this->artisan('bol:prune-portraits')->assertSuccessful();
        Storage::disk('public')->assertExists($file);

        $this->travel(2)->days();
        $this->artisan('bol:prune-portraits')->assertSuccessful();
        Storage::disk('public')->assertMissing($file);
        Storage::disk('public')->assertExists('portraits/lisez-moi.txt');
    }

    public function test_a_dry_run_of_pruning_deletes_nothing(): void
    {
        $hero = $this->hero(self::DATA_URL);
        $file = 'portraits/' . basename($hero->avatar);
        $hero->delete();
        $this->travel(2)->days();

        $this->artisan('bol:prune-portraits', ['--dry-run' => true])->assertSuccessful();

        Storage::disk('public')->assertExists($file);
    }

    private function hero(?string $avatar = null): BolHeros
    {
        return BolHeros::create(['nom' => 'Fiche', 'joueur' => 'Joueur', 'user_id' => $this->user->id, 'type' => 'H', 'avatar' => $avatar]);
    }

    /** Une fiche d'avant les fichiers : son portrait est écrit directement en base. */
    private function legacyHero(string $avatar): string
    {
        $id = $this->hero()->id;
        DB::table('bol_heros')->where('id', $id)->update(['avatar' => $avatar]);

        return $id;
    }
}
