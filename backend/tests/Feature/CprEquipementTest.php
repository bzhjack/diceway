<?php

namespace Tests\Feature;

use App\Models\Cpr\CprDrogue;
use App\Models\Cpr\CprEquipement;
use App\Models\Cpr\CprVetement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cyberpunk RED : équipement, services, vêtements et drogues, remplis par la migration d'après le livre (doc/cyberpunk/resources/equipement.md). */
class CprEquipementTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_catalogue_is_complete(): void
    {
        $this->assertSame(55, CprEquipement::where('type', 'objet')->count());
        $this->assertSame(33, CprEquipement::where('type', 'service')->count());
        $this->assertSame(90, CprVetement::count());
        $this->assertSame(5, CprDrogue::count());
    }

    public function test_equipment_matches_the_book(): void
    {
        $this->assertPrice('agent', 100);
        $this->assertPrice('technoscanner', 1000);
        $this->assertPrice('cryopompe', 5000);
        $this->assertPrice('matelas_et_sac_de_couchage', 20);
        $this->assertPrice('trauma_team_gold', 1000);
        $this->assertPrice('traitement_sd_15', 500);

        $this->assertSame(
            [['type' => 'competence', 'cible' => 'premiers_secours', 'valeur' => 2], ['type' => 'competence', 'cible' => 'assistance_medicale', 'valeur' => 2]],
            $this->objet('mediscanner')->effets,
        );
        $this->assertSame([5, 7, 9], [
            $this->objet('cyberconsole_mauvaise')->effets[0]['emplacements'],
            $this->objet('cyberconsole_standard')->effets[0]['emplacements'],
            $this->objet('cyberconsole_excellente')->effets[0]['emplacements'],
        ]);
    }

    public function test_clothing_prices_match_the_book(): void
    {
        $this->assertClothing('vagabond', 'haut', 10);
        $this->assertClothing('generique', 'bas', 50);
        $this->assertClothing('ame_nomade', 'couvre_chef', 100);
        $this->assertClothing('cadre_sup', 'bijoux', 5000);
        $this->assertClothing('cadre_sup', 'lentilles_de_contact', 100);
        $this->assertClothing('haute_couture', 'bijoux', 50000);
        $this->assertClothing('haute_couture', 'chaussures', 5000);
        $this->assertSame(10, CprVetement::distinct()->count('style'));
        $this->assertSame(9, CprVetement::distinct()->count('piece'));
    }

    public function test_drugs_match_the_book(): void
    {
        $boost = CprDrogue::where('code', 'boost')->firstOrFail();
        $this->assertSame([50, 24, 17], [$boost->prix, $boost->duree_heures, $boost->sd_effet_secondaire]);
        $smash = CprDrogue::where('code', 'smash')->firstOrFail();
        $this->assertSame([10, 4, 15], [$smash->prix, $smash->duree_heures, $smash->sd_effet_secondaire]);
        $this->assertCount(6, $smash->effets);
    }

    public function test_the_reference_serves_equipment_clothing_and_drugs(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/cpr/reference')->assertOk()
            ->assertJsonCount(88, 'equipement')
            ->assertJsonCount(90, 'vetements')
            ->assertJsonCount(5, 'drogues');
    }

    private function objet(string $code): CprEquipement
    {
        return CprEquipement::where('code', $code)->firstOrFail();
    }

    private function assertPrice(string $code, int $prix): void
    {
        $this->assertSame($prix, $this->objet($code)->prix, $code);
    }

    private function assertClothing(string $style, string $piece, int $prix): void
    {
        $this->assertSame($prix, CprVetement::where('style', $style)->where('piece', $piece)->firstOrFail()->prix, "{$style} {$piece}");
    }
}
