<?php

namespace Tests\Feature;

use App\Models\Cpr\CprCyber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cyberpunk RED : le catalogue du cybermatériel, rempli par la migration d'après le livre (doc/cyberpunk/resources/cybermateriel.md). */
class CprCyberTest extends TestCase
{
    use RefreshDatabase;

    private const PH = [0 => null, 2 => '1d6/2', 3 => '1d6', 7 => '2d6', 14 => '4d6'];

    public function test_the_catalogue_is_complete(): void
    {
        $this->assertSame(96, CprCyber::count());
        $this->assertSame(
            ['cyberaudio' => 12, 'cyberfashion' => 7, 'cybermembre' => 30, 'cyberoptique' => 13, 'cyborgimplant' => 5, 'externe' => 4, 'interne' => 13, 'neuromateriel' => 12],
            CprCyber::selectRaw('categorie, count(*) as n')->groupBy('categorie')->orderBy('categorie')->pluck('n', 'categorie')->map(fn ($n) => (int) $n)->all(),
        );
    }

    public function test_foundations_open_the_slots_of_the_book(): void
    {
        $this->assertSame(
            ['cablage_neural' => 5, 'cyberbras' => 4, 'cyberjambe' => 3, 'cyberoeil' => 3, 'kit_cyberaudio' => 3, 'support_de_capteurs' => 5, 'support_de_puces' => 1],
            CprCyber::where('emplacements_fournis', '>', 0)->orderBy('code')->pluck('emplacements_fournis', 'code')->all(),
        );
    }

    public function test_every_requirement_exists_and_every_option_takes_a_slot_of_its_foundation(): void
    {
        $codes = CprCyber::pluck('code')->all();
        foreach (CprCyber::all() as $cyber) {
            foreach ($cyber->requiert ?? [] as $piece) {
                $this->assertContains($piece, $codes, "{$cyber->code} requiert {$piece}");
            }
            $this->assertSame(self::PH[$cyber->ph_fixe], $cyber->ph_des, "{$cyber->code} : PH fixe et dés");
        }
        foreach (['cyberoptique' => 'cyberoeil', 'cyberaudio' => 'cyberaudio'] as $categorie => $emplacement) {
            $options = CprCyber::where('categorie', $categorie)->where('emplacements_fournis', 0)->get();
            $this->assertNotEmpty($options);
            foreach ($options as $option) {
                $this->assertSame($emplacement, $option->emplacement, $option->code);
            }
        }
        $this->assertSame(0, CprCyber::where('installation', 'puce')->where('emplacement', '!=', 'support_de_puces')->count());
    }

    public function test_implants_match_the_book(): void
    {
        $this->assertCyber('cablage_neural', 'centre_medical', 500, 7);
        $this->assertCyber('sandevistan', 'centre_medical', 500, 7);
        $this->assertCyber('kerenzikov', 'centre_medical', 500, 14);
        $this->assertCyber('antidouleur', 'puce', 1000, 14);
        $this->assertCyber('cyberjambe', 'hopital', 100, 3);
        $this->assertCyber('armure_subdermique', 'hopital', 1000, 14);
        $this->assertCyber('maillage_musculosquelettique', 'hopital', 1000, 14);
        $this->assertCyber('ecorcheurs', 'boutique', 100, 2);
        $this->assertCyber('revetement_superchrome', 'boutique', 1000, 0);
        $this->assertCyber('charpente_lineaire_beta', 'hopital', 5000, 14);

        $lumi = $this->cyber('luminosite_faible_infrarouge_uv');
        $this->assertSame([2, true], [$lumi->emplacements_occupes, $lumi->couple]);
        $this->assertSame(3, $this->cyber('pistolet_a_flechettes_oculaire')->emplacements_occupes);
        $this->assertSame(3, $this->cyber('bouclier_escamotable')->emplacements_occupes);
        $this->assertSame(['cyberbras', 'cyberjambe'], $this->cyber('renforcement_electronique')->requiert);
        $this->assertTrue($this->cyber('etripeurs')->bras_de_chair);
        $this->assertSame('neuromateriel', $this->cyber('poignee_subdermique')->emplacement);
    }

    public function test_only_one_megadrenaline_and_one_cyberaudio_kit(): void
    {
        $this->assertEqualsCanonicalizing(['kerenzikov', 'sandevistan'], CprCyber::where('exclusif', 'megadrenaline')->pluck('code')->all());
        $this->assertSame('kit_cyberaudio', $this->cyber('kit_cyberaudio')->exclusif);
    }

    public function test_effects_carry_the_numbers_the_sheet_needs(): void
    {
        $this->assertSame([['type' => 'initiative', 'valeur' => 2]], $this->cyber('kerenzikov')->effets);
        $this->assertSame([['type' => 'carac', 'cible' => 'cor', 'valeur' => 2, 'maximum' => 10, 'cumulable' => true]], $this->cyber('maillage_musculosquelettique')->effets);
        $this->assertSame([['type' => 'pa', 'valeur' => 11, 'zones' => ['tete', 'corps']]], $this->cyber('armure_subdermique')->effets);
        $this->assertSame([['type' => 'arme', 'classe' => 'melee_lourde', 'degats' => '3d6', 'att_round' => 2]], $this->cyber('etripeurs')->effets);
        $this->assertSame(
            ['perception', 'lecture_sur_les_levres', 'dissimulation_revelation_d_objet'],
            array_column($this->cyber('haute_resolution')->effets, 'cible'),
        );
        $this->assertSame(['cor_minimum' => 6, 'maillages' => 1], $this->cyber('charpente_lineaire_sigma')->prerequis);
    }

    public function test_the_reference_serves_the_cyberware(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/cpr/reference')->assertOk()
            ->assertJsonCount(96, 'cyber')
            ->assertJsonPath('cyber.0.code', 'biomoniteur');
    }

    private function cyber(string $code): CprCyber
    {
        return CprCyber::where('code', $code)->firstOrFail();
    }

    private function assertCyber(string $code, string $installation, int $prix, int $ph): void
    {
        $cyber = $this->cyber($code);
        $this->assertSame([$installation, $prix, $ph], [$cyber->installation, $cyber->prix, $cyber->ph_fixe], $code);
    }
}
