<?php

namespace Tests\Feature;

use App\Models\Cpr\CprMaterielNet;
use App\Models\Cpr\CprProgramme;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cyberpunk RED : programmes, GLACE, Démons et matériel de cyberconsole, remplis par la migration d'après le livre (rules/07-netrunning.md). */
class CprNetTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_catalogue_is_complete(): void
    {
        $this->assertSame(
            ['defensif' => 3, 'demon' => 3, 'glace' => 12, 'offensif' => 8, 'soutien' => 4],
            CprProgramme::selectRaw('classe, count(*) as n')->groupBy('classe')->orderBy('classe')->pluck('n', 'classe')->map(fn ($n) => (int) $n)->all(),
        );
        $this->assertSame(6, CprMaterielNet::count());
    }

    public function test_programs_match_the_book(): void
    {
        $sabre = $this->programme('sabre');
        $this->assertSame(['offensif', 'antiprogramme', 1, 0, 0, 50, 1], [$sabre->classe, $sabre->cible, $sabre->att, $sabre->def, $sabre->rez, $sabre->prix, $sabre->emplacements]);
        $armure = $this->programme('armure');
        $this->assertSame(['defensif', 7, 50], [$armure->classe, $armure->rez, $armure->prix]);
        $this->assertSame([2, 100], [$this->programme('feubeu')->att, $this->programme('feubeu')->prix]);
    }

    public function test_black_ice_matches_the_book_and_takes_two_slots(): void
    {
        $this->assertIce('cerbere', 6, 6, 6, 2, 20, 500);
        $this->assertIce('kraken', 6, 2, 8, 4, 30, 1000);
        $this->assertIce('tueur', 4, 8, 6, 2, 20, 500);
        $this->assertIce('putois', 2, 4, 4, 2, 10, 500);
        $this->assertSame(0, CprProgramme::where('classe', 'glace')->where('emplacements', '!=', 2)->count());
    }

    public function test_demons_do_not_fit_in_a_cyberdeck(): void
    {
        $balron = $this->programme('balron');
        $this->assertSame([30, 7, 4, 14, 10000, null], [$balron->rez, $balron->interface, $balron->actions_virtuelles, $balron->valeur_combat, $balron->prix, $balron->emplacements]);
    }

    public function test_hardware_matches_the_book(): void
    {
        $this->assertSame(
            ['barriere_anti_krash' => 2, 'cablage_isole' => 1, 'circuits_renforces' => 1, 'disque_dur_de_sauvegarde' => 2, 'extension_de_portee' => 1, 'verrou_biometrique' => 2],
            CprMaterielNet::orderBy('code')->pluck('emplacements', 'code')->all(),
        );
    }

    public function test_the_reference_serves_the_net(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/cpr/reference')->assertOk()
            ->assertJsonCount(30, 'programmes')
            ->assertJsonCount(6, 'materiel_net');
    }

    private function programme(string $code): CprProgramme
    {
        return CprProgramme::where('code', $code)->firstOrFail();
    }

    private function assertIce(string $code, int $per, int $vit, int $att, int $def, int $rez, int $prix): void
    {
        $glace = $this->programme($code);
        $this->assertSame([$per, $vit, $att, $def, $rez, $prix], [$glace->per, $glace->vit, $glace->att, $glace->def, $glace->rez, $glace->prix], $code);
    }
}
