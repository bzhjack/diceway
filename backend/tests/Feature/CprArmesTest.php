<?php

namespace Tests\Feature;

use App\Models\Cpr\CprAccessoire;
use App\Models\Cpr\CprArme;
use App\Models\Cpr\CprMunition;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cyberpunk RED : armes, munitions et accessoires, remplis par la migration d'après le livre (doc/cyberpunk/resources/armes.md). */
class CprArmesTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_catalogue_is_complete(): void
    {
        $this->assertSame(15, CprArme::whereIn('categorie', ['melee', 'distance'])->count());
        $this->assertSame(14, CprArme::where('categorie', 'exotique')->count());
        $this->assertSame(13, CprMunition::count());
        $this->assertSame(8, CprAccessoire::count());
        $this->assertSame(0, CprArme::whereNotNull('user_id')->count());
    }

    public function test_weapon_classes_match_the_book(): void
    {
        $this->assertWeapon('fusil_d_assaut', '5d6', 25, 'fusil', 1, 2, false, 500, 'armes_d_epaule');
        $this->assertWeapon('pistolet_lourd', '3d6', 8, 'pistolet_l', 2, 1, true, 100, 'pistolet');
        $this->assertWeapon('pistolet_mitrailleur', '2d6', 30, 'pistolet_m', 1, 1, true, 100, 'pistolet');
        $this->assertWeapon('lance_roquettes', '8d6', 1, 'roquette', 1, 2, false, 500, 'armes_lourdes');
        $this->assertWeapon('arc_arbalete', '4d6', null, 'fleche', 1, 2, false, 100, 'tir_a_l_arc');
        $this->assertWeapon('melee_tres_lourde', '4d6', null, null, 1, null, false, 500, 'arme_de_melee');
        $this->assertWeapon('melee_legere', '1d6', null, null, 2, null, true, 50, 'arme_de_melee');

        $this->assertSame(['tir_automatique' => 4, 'tir_de_suppression' => true], $this->arme('fusil_d_assaut')->traits);
        $this->assertSame(['tir_automatique' => 3, 'tir_de_suppression' => true], $this->arme('pistolet_mitrailleur_lourd')->traits);
        $this->assertSame(['chevrotine' => true], $this->arme('fusil_a_pompe')->traits);
    }

    public function test_magazine_sizes_match_the_book(): void
    {
        $this->assertMagazine('pistolet_moyen', 12, 18, 36);
        $this->assertMagazine('pistolet_mitrailleur_lourd', 40, 50, 60);
        $this->assertMagazine('fusil_a_pompe', 4, 8, 16);
        $this->assertMagazine('fusil_de_precision', 4, 8, 12);
        $this->assertMagazine('lance_roquettes', 1, 2, 3);
    }

    public function test_exotic_weapons_inherit_from_their_class(): void
    {
        $malorian = $this->arme('malorian_3516');
        $this->assertSame($this->arme('pistolet_tres_lourd')->id, $malorian->base_id);
        $this->assertSame(['5d6', 8, 'pistolet_tl', 'excellente', 10000], [$malorian->degats, $malorian->chargeur, $malorian->munition, $malorian->qualite, $malorian->prix]);

        $emg = $this->arme('rhinemetall_emg_86');
        $this->assertSame('armes_lourdes', $emg->competence->code);
        $this->assertSame([4, 11, 11, '5d6'], [$emg->chargeur, $emg->cor_minimum, $emg->ignore_armure_sous, $emg->degats]);
        $this->assertNull($emg->traits);

        $helix = $this->arme('tsunami_helix');
        $this->assertSame(['tir_automatique' => 5, 'balles_par_attaque' => 20], $helix->traits);
        $this->assertSame(40, $helix->chargeur);

        $this->assertNull($this->arme('canon_a_ondes')->degats);
        $this->assertSame('batterie', $this->arme('hurleur')->munition);
        $this->assertSame([2, 4, 5000], [$this->arme('militech_cowboy_u56')->att_round, $this->arme('militech_cowboy_u56')->chargeur, $this->arme('militech_cowboy_u56')->prix]);
        $this->assertSame(['4d6', 1, 2, 'excellente', 11], [
            $this->arme('kendachi_mono_trois')->degats, $this->arme('kendachi_mono_trois')->att_round, $this->arme('kendachi_mono_trois')->mains,
            $this->arme('kendachi_mono_trois')->qualite, $this->arme('kendachi_mono_trois')->ignore_armure_sous,
        ]);
        $this->assertNull($this->arme('gantelet_de_combat')->base_id);
        $this->assertSame(['emplacements_cyberbras' => 3], $this->arme('gantelet_de_combat')->traits);

        // Les capacités de chargeur des accessoires ne s'appliquent pas aux armes exotiques.
        $this->assertSame(0, CprArme::where('categorie', 'exotique')->whereNotNull('chargeur_extension')->count());
    }

    public function test_ammunition_matches_the_book(): void
    {
        $this->assertAmmo('standard', 10, ['pistolet_m', 'pistolet_l', 'pistolet_tl', 'slug', 'fusil', 'chevrotine', 'fleche']);
        $this->assertAmmo('perforante', 100, ['pistolet_m', 'pistolet_l', 'pistolet_tl', 'slug', 'fusil', 'fleche', 'grenade', 'roquette']);
        $this->assertAmmo('incendiaire', 100, ['pistolet_m', 'pistolet_l', 'pistolet_tl', 'slug', 'fusil', 'chevrotine', 'fleche', 'grenade']);
        $this->assertAmmo('intelligente', 500, ['pistolet_m', 'pistolet_l', 'pistolet_tl', 'slug', 'fusil', 'fleche', 'roquette']);
        $this->assertAmmo('biotoxine', 500, ['fleche', 'grenade']);
        $this->assertAmmo('fumigene', 50, ['grenade']);
    }

    public function test_accessories_match_the_book(): void
    {
        $smartgun = CprAccessoire::where('code', 'liaison_smartgun')->firstOrFail();
        $this->assertSame([500, 2, 'distance'], [$smartgun->prix, $smartgun->emplacements, $smartgun->compatibilite]);
        $baionnette = CprAccessoire::where('code', 'baionnette')->firstOrFail();
        $this->assertSame([100, 1, 'armes_d_epaule', false], [$baionnette->prix, $baionnette->emplacements, $baionnette->compatibilite, $baionnette->dissimulable]);
    }

    public function test_the_reference_serves_the_book_catalogue_only(): void
    {
        $compte = User::factory()->create();
        CprArme::query()->insert(['user_id' => $compte->id, 'nom' => 'Arme maison', 'categorie' => 'melee', 'prix' => 10]);
        Sanctum::actingAs($compte);

        $response = $this->getJson('/api/cpr/reference')->assertOk();

        $response->assertJsonCount(29, 'armes');
        $response->assertJsonCount(13, 'munitions');
        $response->assertJsonCount(8, 'accessoires');
        $response->assertJsonPath('armes.0.code', 'melee_legere');
    }

    private function arme(string $code): CprArme
    {
        return CprArme::where('code', $code)->firstOrFail();
    }

    private function assertWeapon(string $code, string $degats, ?int $chargeur, ?string $munition, int $att, ?int $mains, bool $dissimulable, int $prix, string $competence): void
    {
        $arme = $this->arme($code);
        $this->assertSame(
            [$degats, $chargeur, $munition, $att, $mains, $dissimulable, $prix, $competence],
            [$arme->degats, $arme->chargeur, $arme->munition, $arme->att_round, $arme->mains, $arme->dissimulable, $arme->prix, $arme->competence->code],
            $code,
        );
    }

    private function assertMagazine(string $code, int $ordinaire, int $extension, int $cylindre): void
    {
        $arme = $this->arme($code);
        $this->assertSame([$ordinaire, $extension, $cylindre], [$arme->chargeur, $arme->chargeur_extension, $arme->chargeur_cylindre], $code);
    }

    private function assertAmmo(string $code, int $prix, array $types): void
    {
        $munition = CprMunition::where('code', $code)->firstOrFail();
        $this->assertSame([$prix, $types], [$munition->prix, $munition->types], $code);
    }
}
