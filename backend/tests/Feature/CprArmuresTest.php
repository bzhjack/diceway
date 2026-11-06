<?php

namespace Tests\Feature;

use App\Models\Cpr\CprArmure;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cyberpunk RED : armures et bouclier, remplis par la migration d'après le livre (doc/cyberpunk/resources/armures.md). */
class CprArmuresTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_catalogue_is_complete(): void
    {
        $this->assertSame(8, CprArmure::where('type', 'armure')->count());
        $this->assertSame(1, CprArmure::where('type', 'bouclier')->count());
    }

    public function test_armors_match_the_book(): void
    {
        $this->assertArmor('cuir', 4, 0, 20);
        $this->assertArmor('kevlar', 7, 0, 50);
        $this->assertArmor('tenue_pare_balles_legere', 11, 0, 100);
        $this->assertArmor('tenue_pare_balles_moyenne', 12, 2, 100);
        $this->assertArmor('tenue_pare_balles_lourde', 13, 2, 500);
        $this->assertArmor('flak', 15, 4, 500);
        $this->assertArmor('metalgear', 18, 4, 5000);
    }

    public function test_the_net_suit_covers_head_and_body_and_adds_a_hardware_slot(): void
    {
        $combinaison = $this->armure('combinaison_connectee');
        $this->assertSame([11, 0, 1000, true, 1], [$combinaison->pa, $combinaison->penalite, $combinaison->prix, $combinaison->tete_et_corps, $combinaison->emplacements_materiel]);
        $this->assertSame(1, CprArmure::where('tete_et_corps', true)->count());
    }

    public function test_the_ballistic_shield_has_hit_points_not_stopping_power(): void
    {
        $bouclier = $this->armure('bouclier_balistique');
        $this->assertSame([null, 10, 100], [$bouclier->pa, $bouclier->ps, $bouclier->prix]);
    }

    public function test_the_reference_serves_the_armors(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/cpr/reference')->assertOk()
            ->assertJsonCount(9, 'armures')
            ->assertJsonPath('armures.2.code', 'tenue_pare_balles_legere')
            ->assertJsonPath('armures.2.pa', 11);
    }

    private function armure(string $code): CprArmure
    {
        return CprArmure::where('code', $code)->firstOrFail();
    }

    private function assertArmor(string $code, int $pa, int $penalite, int $prix): void
    {
        $armure = $this->armure($code);
        $this->assertSame([$pa, $penalite, $prix, false], [$armure->pa, $armure->penalite, $armure->prix, $armure->tete_et_corps], $code);
    }
}
