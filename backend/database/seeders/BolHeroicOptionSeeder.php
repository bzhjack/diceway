<?php

namespace Database\Seeders;

use App\Models\Bol\BolHeroicOption;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class BolHeroicOptionSeeder extends Seeder
{
    public function run(): void
    {
        $options = [
            ['id' => 1, 'label' => 'Carnage',                  'slug' => 'carnage',       'description' => 'Attaque supplémentaire immédiate',                               'ordre' => 1],
            ['id' => 2, 'label' => 'Coup dévastateur',         'slug' => 'devastateur',   'description' => '+6 dégâts',                                                      'ordre' => 2],
            ['id' => 3, 'label' => 'Coup précis',              'slug' => 'precis',        'description' => 'Dégâts normaux + dé de malus sur un jet (accord MJ)',             'ordre' => 3],
            ['id' => 4, 'label' => 'Désarmement',              'slug' => 'desarmement',   'description' => 'Adversaire perd son arme (pas de dégâts)',                        'ordre' => 4],
            ['id' => 5, 'label' => 'Massacrer la piétaille',   'slug' => 'massacre',      'description' => 'Dégâts = nombre de piétaille mis hors combat',                   'ordre' => 5],
            ['id' => 6, 'label' => 'Renversement',             'slug' => 'renversement',  'description' => 'Adversaire à terre, dé de malus à sa prochaine action',          'ordre' => 6],
        ];

        Schema::disableForeignKeyConstraints();
        BolHeroicOption::truncate();
        Schema::enableForeignKeyConstraints();
        foreach ($options as $option) {
            BolHeroicOption::create($option);
        }
    }
}
