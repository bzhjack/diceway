<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BolRegionAvantage;

class BolRegionAvantageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions_avantages = [
            // Désert de Beshaar
            ['region_id' => 1, 'avantage_id' => 2],
            ['region_id' => 1, 'avantage_id' => 6],
            ['region_id' => 1, 'avantage_id' => 9],
            ['region_id' => 1, 'avantage_id' => 11],
            ['region_id' => 1, 'avantage_id' => 35],
            ['region_id' => 1, 'avantage_id' => 46],
            ['region_id' => 1, 'avantage_id' => 58],
            ['region_id' => 1, 'avantage_id' => 59],
        ];

        // Insérer les données dans la table des régions
        foreach ($regions_avantages as $region_avantage) {
            BolRegionAvantage::create($region_avantage);
        }
    }
}
