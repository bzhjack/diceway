<?php

namespace Database\Seeders;

use App\Models\Bol\BolCombatOption;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class BolCombatOptionSeeder extends Seeder
{
    public function run(): void
    {
        $options = [
            ['id' => 1, 'label' => 'Aucune',                          'slug' => 'none',        'modificateur' => 0,  'modificateur_armor' => false, 'note' => null,                                    'ordre' => 1],
            ['id' => 2, 'label' => 'Posture offensive',               'slug' => 'offensive',   'modificateur' => 1,  'modificateur_armor' => false, 'note' => '+1 atk / −1 déf',                       'ordre' => 2],
            ['id' => 3, 'label' => 'Attaque intrépide',               'slug' => 'intrepid',    'modificateur' => 2,  'modificateur_armor' => false, 'note' => '+2 atk / −2 déf, perd bouclier',        'ordre' => 3],
            ['id' => 4, 'label' => 'Posture défensive',               'slug' => 'defensive',   'modificateur' => -1, 'modificateur_armor' => false, 'note' => '−1 atk / +1 déf',                       'ordre' => 4],
            ['id' => 5, 'label' => 'Combat 2 armes — parade',        'slug' => 'dual-parry',  'modificateur' => -1, 'modificateur_armor' => false, 'note' => '−1 atk / +1 déf',                       'ordre' => 5],
            ['id' => 6, 'label' => 'Combat 2 armes — double frappe', 'slug' => 'dual-strike', 'modificateur' => -1, 'modificateur_armor' => false, 'note' => '−1 atk / dégâts +1 catégorie',          'ordre' => 6],
            ['id' => 7, 'label' => 'Attaque au défaut de l\'armure', 'slug' => 'armor-chink', 'modificateur' => 0,  'modificateur_armor' => true,  'note' => 'Si touché : ignore l\'armure',           'ordre' => 7],
        ];

        Schema::disableForeignKeyConstraints();
        BolCombatOption::truncate();
        Schema::enableForeignKeyConstraints();
        foreach ($options as $option) {
            BolCombatOption::create($option);
        }
    }
}
