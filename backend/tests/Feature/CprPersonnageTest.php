<?php

namespace Tests\Feature;

use App\Models\Cpr\CprArme;
use App\Models\Cpr\CprPersonnage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Cyberpunk RED : les fiches de personnage, enregistrées en un document (étape 2.1 du plan). */
class CprPersonnageTest extends TestCase
{
    use RefreshDatabase;

    private User $a;
    private User $b;

    protected function setUp(): void
    {
        parent::setUp();
        $this->a = User::factory()->create();
        $this->b = User::factory()->create();
    }

    public function test_a_sheet_needs_an_account(): void
    {
        $this->getJson('/api/cpr/personnages')->assertUnauthorized();
        $this->postJson('/api/cpr/personnages', $this->fiche())->assertUnauthorized();
    }

    public function test_a_full_sheet_comes_back_as_it_was_sent(): void
    {
        Sanctum::actingAs($this->a);

        $id = $this->postJson('/api/cpr/personnages', $this->fiche())->assertCreated()->json('id');

        $fiche = $this->getJson("/api/cpr/personnages/{$id}")->assertOk();
        $fiche->assertJsonPath('pseudo', 'Kelsa')
            ->assertJsonPath('methode', 'edgerunner')
            ->assertJsonPath('statut', 'brouillon')
            ->assertJsonPath('role_id', $this->id('cpr_role', 'solo'))
            ->assertJsonPath('ref', 8)
            ->assertJsonPath('parcours.origine', 'Europe de l’Ouest')
            ->assertJsonCount(1, 'roles')
            ->assertJsonPath('roles.0.rang', 4)
            ->assertJsonCount(2, 'competences')
            ->assertJsonPath('competences.1.precision', 'français')
            ->assertJsonPath('armes.0.qualite', 'excellente')
            ->assertJsonPath('armes.0.accessoires', ['liaison_smartgun'])
            ->assertJsonCount(2, 'armures')
            ->assertJsonCount(3, 'cyber')
            ->assertJsonPath('objets.0.quantite', 50);

        $this->assertSame((string) $this->a->id, (string) CprPersonnage::find($id)->user_id);
    }

    public function test_implants_are_linked_to_their_foundation_on_the_same_sheet(): void
    {
        Sanctum::actingAs($this->a);
        $id = $this->postJson('/api/cpr/personnages', $this->fiche())->assertCreated()->json('id');

        $cyber = collect($this->getJson("/api/cpr/personnages/{$id}")->json('cyber'))->keyBy('cyber_id');
        $cablage = $cyber[$this->id('cpr_cyber', 'cablage_neural')];
        $sandevistan = $cyber[$this->id('cpr_cyber', 'sandevistan')];
        $this->assertNull($cablage['parent_id']);
        $this->assertSame($cablage['id'], $sandevistan['parent_id']);
        $this->assertSame(7, $sandevistan['ph']);
    }

    public function test_an_update_replaces_the_lines_of_the_sheet(): void
    {
        Sanctum::actingAs($this->a);
        $id = $this->postJson('/api/cpr/personnages', $this->fiche())->assertCreated()->json('id');

        $fiche = $this->fiche();
        $fiche['pseudo'] = 'Kelsa la Rouge';
        $fiche['competences'] = [['competence_id' => $this->id('cpr_competence', 'esquive'), 'niveau' => 6]];
        $fiche['cyber'] = [];
        $this->putJson("/api/cpr/personnages/{$id}", $fiche)->assertOk()
            ->assertJsonPath('pseudo', 'Kelsa la Rouge')
            ->assertJsonCount(1, 'competences')
            ->assertJsonCount(0, 'cyber');

        $this->assertSame(1, DB::table('cpr_personnage_competence')->where('personnage_id', $id)->count());
        $this->assertSame(0, DB::table('cpr_personnage_cyber')->where('personnage_id', $id)->count());
    }

    public function test_an_account_lists_only_its_own_sheets(): void
    {
        Sanctum::actingAs($this->a);
        $this->postJson('/api/cpr/personnages', $this->fiche())->assertCreated();
        Sanctum::actingAs($this->b);
        $this->postJson('/api/cpr/personnages', ['pseudo' => 'Rico Rico'])->assertCreated();

        $this->getJson('/api/cpr/personnages')->assertOk()->assertJsonCount(1)->assertJsonPath('0.pseudo', 'Rico Rico');
    }

    public function test_another_account_cannot_see_change_or_delete_a_sheet(): void
    {
        Sanctum::actingAs($this->a);
        $id = $this->postJson('/api/cpr/personnages', $this->fiche())->assertCreated()->json('id');

        Sanctum::actingAs($this->b);
        $this->getJson("/api/cpr/personnages/{$id}")->assertNotFound();
        $this->putJson("/api/cpr/personnages/{$id}", ['pseudo' => 'Volé'])->assertNotFound();
        $this->deleteJson("/api/cpr/personnages/{$id}")->assertNotFound();

        $this->assertSame('Kelsa', CprPersonnage::find($id)->pseudo);
    }

    public function test_the_owner_deletes_the_sheet_and_its_lines(): void
    {
        Sanctum::actingAs($this->a);
        $id = $this->postJson('/api/cpr/personnages', $this->fiche())->assertCreated()->json('id');

        $this->deleteJson("/api/cpr/personnages/{$id}")->assertOk();

        $this->assertNull(CprPersonnage::find($id));
        $this->assertSame(0, DB::table('cpr_personnage_cyber')->where('personnage_id', $id)->count());
        $this->assertSame(0, DB::table('cpr_personnage_objet')->where('personnage_id', $id)->count());
    }

    public function test_a_catalogue_sheet_is_read_by_all_and_changed_by_nobody(): void
    {
        $id = CprPersonnage::create(['pseudo' => 'Booster'])->id;
        Sanctum::actingAs($this->b);

        $this->getJson("/api/cpr/personnages/{$id}")->assertOk()->assertJsonPath('pseudo', 'Booster');
        $this->putJson("/api/cpr/personnages/{$id}", ['pseudo' => 'Mon booster'])->assertNotFound();
        $this->deleteJson("/api/cpr/personnages/{$id}")->assertNotFound();
    }

    public function test_the_account_never_comes_from_the_request(): void
    {
        Sanctum::actingAs($this->a);
        $id = $this->postJson('/api/cpr/personnages', ['pseudo' => 'Kelsa', 'user_id' => $this->b->id])->assertCreated()->json('id');

        $this->assertSame((string) $this->a->id, (string) CprPersonnage::find($id)->user_id);
    }

    public function test_an_item_of_another_account_is_refused(): void
    {
        $arme = CprArme::query()->insertGetId(['user_id' => $this->b->id, 'nom' => 'Lame de B', 'categorie' => 'melee', 'prix' => 50]);
        Sanctum::actingAs($this->a);

        $this->postJson('/api/cpr/personnages', ['pseudo' => 'Kelsa', 'armes' => [['arme_id' => $arme]]])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['armes.0.arme_id']);
    }

    public function test_invalid_references_are_refused(): void
    {
        Sanctum::actingAs($this->a);

        $this->postJson('/api/cpr/personnages', ['pseudo' => 'Kelsa', 'competences' => [['competence_id' => 9999, 'niveau' => 2]]])
            ->assertStatus(422)->assertJsonValidationErrors(['competences.0.competence_id']);
        $this->postJson('/api/cpr/personnages', ['pseudo' => 'Kelsa', 'objets' => [['objet_type' => 'equipement', 'objet_id' => 9999]]])
            ->assertStatus(422)->assertJsonValidationErrors(['objets.0.objet_id']);
        $this->postJson('/api/cpr/personnages', ['pseudo' => 'Kelsa', 'cyber' => [
            ['cle' => 'a', 'cyber_id' => $this->id('cpr_cyber', 'sandevistan'), 'parent' => 'inconnu'],
        ]])->assertStatus(422)->assertJsonValidationErrors(['cyber.0.parent']);
        $this->postJson('/api/cpr/personnages', ['joueur' => 'Laure'])
            ->assertStatus(422)->assertJsonValidationErrors(['pseudo']);
        $this->assertSame(0, CprPersonnage::count());
    }

    /** Un Solo Edgerunner complet : rôle, CARAC, compétences, arme, armure, implants posés dans leur pièce mère, munitions. */
    private function fiche(): array
    {
        return [
            'pseudo' => 'Kelsa',
            'joueur' => 'Laure',
            'methode' => 'edgerunner',
            'role_id' => $this->id('cpr_role', 'solo'),
            'int' => 6, 'ref' => 8, 'dex' => 7, 'tech' => 4, 'pres' => 6, 'vol' => 6, 'cha' => 6, 'mouv' => 6, 'cor' => 7, 'emp' => 5,
            'eddies' => 500,
            'parcours' => ['origine' => 'Europe de l’Ouest', 'personnalite' => 'Stable et réfléchi'],
            'roles' => [['role_id' => $this->id('cpr_role', 'solo'), 'rang' => 4, 'details' => ['attaque_de_precision' => 3, 'reaction_d_initiative' => 1]]],
            'competences' => [
                ['competence_id' => $this->id('cpr_competence', 'pistolet'), 'niveau' => 6],
                ['competence_id' => $this->id('cpr_competence', 'langue'), 'precision' => 'français', 'niveau' => 4],
            ],
            'armes' => [['arme_id' => $this->id('cpr_arme', 'pistolet_tres_lourd'), 'qualite' => 'excellente', 'accessoires' => ['liaison_smartgun'], 'munition' => 'standard']],
            'armures' => [
                ['armure_id' => $this->id('cpr_armure', 'tenue_pare_balles_legere'), 'localisation' => 'corps'],
                ['armure_id' => $this->id('cpr_armure', 'tenue_pare_balles_legere'), 'localisation' => 'tete'],
            ],
            'cyber' => [
                ['cle' => 'cablage', 'cyber_id' => $this->id('cpr_cyber', 'cablage_neural'), 'ph' => 7],
                ['cle' => 'sande', 'cyber_id' => $this->id('cpr_cyber', 'sandevistan'), 'parent' => 'cablage', 'ph' => 7],
                ['cle' => 'bio', 'cyber_id' => $this->id('cpr_cyber', 'biomoniteur'), 'ph' => 0],
            ],
            'objets' => [
                ['objet_type' => 'munition', 'objet_id' => $this->id('cpr_munition', 'standard'), 'quantite' => 50, 'precision' => 'pistolet_tl'],
                ['objet_type' => 'equipement', 'objet_id' => $this->id('cpr_equipement', 'agent')],
                ['objet_type' => 'vetement', 'objet_id' => DB::table('cpr_vetement')->where('style', 'decontracte')->where('piece', 'veste')->value('id'), 'quantite' => 3],
            ],
        ];
    }

    private function id(string $table, string $code): int
    {
        return (int) DB::table($table)->where('code', $code)->value('id');
    }
}
