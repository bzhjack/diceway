<?php

namespace Tests\Unit;

use App\Exceptions\Bol\ScenarioImportException;
use App\Http\Services\Bol\BolImportCatalog;
use App\Http\Services\Bol\BolScenarioImporter;
use App\Http\Services\Bol\BolScenarioImportPlan;
use PHPUnit\Framework\TestCase;

class BolScenarioImportPlanTest extends TestCase
{
    private function catalog(): BolImportCatalog
    {
        return new BolImportCatalog([
            'region'      => ['Satarla' => 14, 'Malakut' => 7],
            'carriere'    => ['Voleur' => 26, 'Marin' => 13, 'Prêtre' => 21],
            'arme'        => ['Gourdin' => 6, 'Bâton' => 2, 'Masse d’armes' => 9],
            'armure'      => ['Petit bouclier' => 5],
            'avantage'    => ['Dur à cuire' => 3],
            'desavantage' => ['Cupide' => 4],
            'capacite'    => ['Attaque spéciale' => 2],
            'pouvoir'     => [],
            'taille'      => ['Moyenne' => 4],
            'categorie'   => [],
            'pnj'         => [],
            'creature'    => ['Dinohyus' => 'cat-dino'],
            'demon'       => [],
        ]);
    }

    /** @return array<string, mixed> */
    private function data(): array
    {
        return [
            'saga'        => 'perle-du-beshaar',
            'scenario'    => ['cle' => 'ch1', 'titre' => '  Sacrilège à Satarla ', 'pitch' => 'Un vol qui tourne mal.'],
            'personnages' => [
                'surdral' => [
                    'kind' => 'pnj', 'nom' => 'Surdral Prados', 'rang' => 'rival',
                    'agilite' => 2, 'esprit' => 1, 'melee' => 1, 'defense' => 1, 'vitalite' => 10, 'heroisme' => 3,
                    'carrieres' => [['nom' => 'voleur', 'rang' => 3]],
                    'armes' => ['gourdin', ['nom' => 'Canne au pommeau plombé', 'degats' => 'd6', 'type' => 'M']],
                    'armures' => ['Petit bouclier'],
                    'avantages' => ['Dur à cuire'],
                ],
                'pretre' => [
                    'kind' => 'pnj', 'nom' => 'Prêtre de Shazzadion', 'rang' => 'coriace', 'vitalite' => 6,
                    'carrieres' => [['nom' => 'Prêtre', 'rang' => 2]], 'armes' => ['Bâton'],
                ],
                'hippocampe' => [
                    'kind' => 'creature', 'nom' => 'Hippocampe géant', 'taille' => 'Moyenne',
                    'vitalite' => 6, 'attaque' => 1, 'degats' => 'd6M',
                    'capacites' => [['nom' => 'Attaque spéciale', 'detail' => 'souffle dans la conque']],
                ],
                'dino' => ['kind' => 'creature', 'catalogue' => 'Dinohyus'],
            ],
            'scenes' => [
                [
                    'cle' => 'temple', 'titre' => 'Le temple de Shazzadion', 'region' => 'Satarla', 'moment' => 'nuit',
                    'danger' => 1, 'lecture' => 'Une grande nef.', 'jeu' => 'Discrétion : Agilité.',
                    'pistes' => [['texte' => 'Entrer dans le sanctuaire', 'vers' => 'sanctuaire']],
                    'distribution' => [['perso' => 'pretre', 'qty' => 2, 'attitude' => 'neutre']],
                ],
                [
                    'cle' => 'sanctuaire', 'titre' => 'Le sanctuaire interdit',
                    'distribution' => [['perso' => 'hippocampe', 'qty' => 2], ['perso' => 'surdral', 'camp' => 'heros'], ['perso' => 'marsus']],
                ],
            ],
        ];
    }

    /** @param array<string, mixed> $data */
    private function errors(array $data): array
    {
        try {
            BolScenarioImportPlan::fromArray($data, $this->catalog());
        } catch (ScenarioImportException $e) {
            return $e->errors;
        }
        $this->fail('le fichier aurait dû être refusé');
    }

    public function test_resolves_names_and_fields(): void
    {
        $plan = BolScenarioImportPlan::fromArray($this->data(), $this->catalog());

        $this->assertSame('perle-du-beshaar', $plan->saga);
        $this->assertSame(['cle' => 'ch1', 'titre' => 'Sacrilège à Satarla', 'pitch' => 'Un vol qui tourne mal.'], $plan->scenario);

        $surdral = $plan->personnages['surdral'];
        $this->assertSame('R', $surdral['fields']['type']);
        $this->assertSame('master', $surdral['fields']['joueur']);
        $this->assertSame(0, $surdral['fields']['vigueur']);
        $this->assertSame(3, $surdral['fields']['heroisme']);
        $this->assertSame([['carriere_id' => 26, 'value' => 3]], $surdral['carrieres']);
        $this->assertSame(6, $surdral['armes'][0]['id']);
        $this->assertSame('Canne au pommeau plombé', $surdral['armes'][1]['custom']['arme']);
        $this->assertSame([5], $surdral['armures']);
        $this->assertSame([['id' => 3, 'type' => 'A', 'detail' => null]], $surdral['traits']);

        $this->assertSame(4, $plan->personnages['hippocampe']['fields']['id_taille']);
        $this->assertSame([['id' => 2, 'detail' => 'souffle dans la conque']], $plan->personnages['hippocampe']['capacites']);
        $this->assertSame(['kind' => 'creature', 'catalogue_id' => 'cat-dino'], $plan->personnages['dino']);

        $temple = $plan->scenes[0];
        $this->assertSame(14, $temple['fields']['region_id']);
        $this->assertSame('Discrétion : Agilité.', $temple['fields']['jeu']);
        $this->assertNull($temple['fields']['meteo']);
        $this->assertSame([['texte' => 'Entrer dans le sanctuaire', 'vers' => 'sanctuaire']], $temple['pistes']);
        $this->assertNull($plan->scenes[1]['fields']['danger']);
    }

    public function test_a_character_not_defined_here_is_external(): void
    {
        $plan = BolScenarioImportPlan::fromArray($this->data(), $this->catalog());

        $this->assertSame(['marsus'], $plan->externes);
    }

    public function test_names_ignore_case_spaces_and_apostrophes(): void
    {
        $data = $this->data();
        $data['personnages']['pretre']['armes'] = ["  masse D'ARMES "];

        $plan = BolScenarioImportPlan::fromArray($data, $this->catalog());

        $this->assertSame(9, $plan->personnages['pretre']['armes'][0]['id']);
    }

    public function test_reports_every_error_with_its_path(): void
    {
        $data = $this->data();
        $data['saga'] = 'Perle du Beshaar';
        $data['personnages']['surdral']['carrieres'][] = ['nom' => 'Voleuse', 'rang' => 1];
        $data['personnages']['pretre']['rang'] = 'sbire';
        $data['scenes'][0]['region'] = 'Atlantide';
        $data['scenes'][0]['moment'] = 'minuit';
        $data['scenes'][1]['pistes'] = [['texte' => 'Fuir', 'vers' => 'quai']];

        $errors = $this->errors($data);

        $this->assertCount(6, $errors);
        $this->assertStringStartsWith('saga : ', $errors[0]);
        $this->assertContains('personnages.surdral.carrieres[1].nom : « Voleuse » est inconnu du catalogue (carriere)', $errors);
        $this->assertContains('personnages.pretre.rang : rival, coriace ou pietaille', $errors);
        $this->assertContains('scenes[0].region : « Atlantide » est inconnu du catalogue (region)', $errors);
        $this->assertContains('scenes[0].moment : aube, jour, crepuscule, nuit', $errors);
        $this->assertContains('scenes[1].pistes[0].vers : aucune scène de clé « quai » dans ce fichier', $errors);
    }

    public function test_enforces_the_same_limits_as_the_editor(): void
    {
        $data = $this->data();
        $data['scenes'][0]['titre'] = str_repeat('a', 121);
        $data['scenes'][0]['lecture'] = str_repeat('é', 5001);
        $data['scenes'][0]['danger'] = 5;
        $data['scenes'][0]['image'] = 'http://exemple.org/a.jpg';
        $data['scenes'][0]['pistes'] = array_fill(0, 9, ['texte' => 'Suivre']);
        $data['scenes'][1]['distribution'][0]['qty'] = 31;

        $errors = $this->errors($data);

        $this->assertContains('scenes[0].titre : 120 caractères au plus (121)', $errors);
        $this->assertContains('scenes[0].lecture : 5000 caractères au plus (5001)', $errors);
        $this->assertContains('scenes[0].danger : entier de 1 à 4', $errors);
        $this->assertContains('scenes[0].image : commence par https:// ou /assets/', $errors);
        $this->assertContains('scenes[0].pistes : 8 pistes au plus', $errors);
        $this->assertContains('scenes[1].distribution[0].qty : entier de 1 à 30', $errors);
    }

    public function test_refuses_duplicate_scene_keys_and_missing_required_fields(): void
    {
        $data = $this->data();
        $data['scenes'][1]['cle'] = 'temple';
        unset($data['personnages']['pretre']['vitalite'], $data['personnages']['hippocampe']['degats']);

        $errors = $this->errors($data);

        $this->assertContains("scenes[1].cle : « temple » est déjà la clé d'une autre scène", $errors);
        $this->assertContains('personnages.pretre.vitalite : obligatoire', $errors);
        $this->assertContains('personnages.hippocampe.degats : obligatoire', $errors);
    }

    public function test_distribution_gives_one_entry_per_pnj_and_a_lot_per_creature(): void
    {
        $entries = [
            ['perso' => 'pretre', 'qty' => 2, 'camp' => 'adversaires', 'attitude' => 'neutre'],
            ['perso' => 'hippocampe', 'qty' => 3, 'camp' => 'adversaires', 'attitude' => null],
        ];

        $result = BolScenarioImporter::distribution($entries, ['pretre' => ['pnj', 'p1'], 'hippocampe' => ['creature', 'c1']]);

        $this->assertCount(3, $result);
        $this->assertSame(['kind' => 'pnj', 'source_id' => 'p1', 'qty' => 1, 'camp' => 'adversaires', 'attitude' => 'neutre', 'positions' => [null]], $result[0]);
        $this->assertSame($result[0], $result[1]);
        $this->assertSame(['kind' => 'creature', 'source_id' => 'c1', 'qty' => 3, 'camp' => 'adversaires', 'attitude' => null, 'positions' => [null, null, null]], $result[2]);
    }
}
