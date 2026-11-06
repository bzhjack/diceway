<?php

namespace Tests\Feature;

use App\Models\Cpr\CprAmeliorationVehicule;
use App\Models\Cpr\CprVehicule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cyberpunk RED : véhicules et améliorations du Nomade, remplis par la migration d'après le livre (rules/04-combat.md, rules/03-capacites-de-role.md). */
class CprVehiculesTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_catalogue_is_complete(): void
    {
        $this->assertSame(14, CprVehicule::count());
        $this->assertSame(19, CprAmeliorationVehicule::count());
    }

    public function test_vehicles_match_the_book(): void
    {
        $this->assertVehicle('moto_de_route', 35, 2, 20, 161, 20000);
        $this->assertVehicle('supervoiture', 50, 2, 60, 483, 100000);
        $this->assertVehicle('av_4', 100, 6, 40, 322, 50000);
        $this->assertVehicle('hors_bord', 50, 4, 20, 97, 30000);
        $yacht = CprVehicule::where('code', 'yacht')->firstOrFail();
        $this->assertSame([100, 4, 10, 50000, 4], [$yacht->pds, $yacht->places, $yacht->mouv, $yacht->prix, $yacht->pieces_minimum]);
    }

    public function test_the_family_garage_opens_by_moto_rank(): void
    {
        $this->assertEqualsCanonicalizing(['moto_de_route', 'voiture_compacte', 'jet_ski', 'gyrocoptere'], CprVehicule::where('rang_nomade', 1)->pluck('code')->all());
        $this->assertEqualsCanonicalizing(['helicoptere', 'voiture_haute_performance', 'hors_bord'], CprVehicule::where('rang_nomade', 5)->pluck('code')->all());
        $this->assertEqualsCanonicalizing(['av_4', 'bateau_de_plaisance', 'supermoto'], CprVehicule::where('rang_nomade', 7)->pluck('code')->all());
        $this->assertEqualsCanonicalizing(['aerozep', 'av_9', 'supervoiture', 'yacht'], CprVehicule::where('rang_nomade', 9)->pluck('code')->all());
    }

    public function test_upgrades_match_the_book(): void
    {
        $blinde = CprAmeliorationVehicule::where('code', 'chassis_blinde')->firstOrFail();
        $this->assertSame([5, 'tous', [['type' => 'pa', 'valeur' => 13]]], [$blinde->rang_requis, $blinde->vehicules, $blinde->effets]);
        $roquettes = CprAmeliorationVehicule::where('code', 'lance_roquettes_integre')->firstOrFail();
        $this->assertSame([5, 'sauf_legers', 'chassis_lourd'], [$roquettes->rang_requis, $roquettes->vehicules, $roquettes->prerequis]);
        $this->assertSame(7, CprAmeliorationVehicule::where('code', 'moteur_d_av_4')->value('rang_requis'));
        $this->assertSame(1, CprAmeliorationVehicule::where('code', 'verre_pare_balles')->value('rang_requis'));
        foreach (CprAmeliorationVehicule::whereNotNull('prerequis')->pluck('prerequis') as $prerequis) {
            $this->assertTrue(CprAmeliorationVehicule::where('code', $prerequis)->exists(), $prerequis);
        }
    }

    public function test_the_reference_serves_vehicles(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/cpr/reference')->assertOk()
            ->assertJsonCount(14, 'vehicules')
            ->assertJsonCount(19, 'ameliorations_vehicule');
    }

    private function assertVehicle(string $code, int $pds, int $places, int $mouv, int $vitesse, int $prix): void
    {
        $vehicule = CprVehicule::where('code', $code)->firstOrFail();
        $this->assertSame([$pds, $places, $mouv, $vitesse, $prix], [$vehicule->pds, $vehicule->places, $vehicule->mouv, $vehicule->vitesse_kmh, $vehicule->prix], $code);
    }
}
