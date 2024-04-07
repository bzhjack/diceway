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
            ['region_id' => 1, 'avantage_id' => 2, 'detail' => 'javelot'],
            ['region_id' => 1, 'avantage_id' => 6],
            ['region_id' => 1, 'avantage_id' => 9],
            ['region_id' => 1, 'avantage_id' => 11],
            ['region_id' => 1, 'avantage_id' => 35],
            ['region_id' => 1, 'avantage_id' => 46],
            ['region_id' => 1, 'avantage_id' => 58],
            ['region_id' => 1, 'avantage_id' => 59],
            // Halakh
            ['region_id' => 2, 'avantage_id' => 2, 'detail' => 'Kriss'],
            ['region_id' => 2, 'avantage_id' => 18],
            ['region_id' => 2, 'avantage_id' => 34],
            ['region_id' => 2, 'avantage_id' => 38],
            ['region_id' => 2, 'avantage_id' => 46],
            ['region_id' => 2, 'avantage_id' => 48],
            ['region_id' => 2, 'avantage_id' => 58],
            // Îles du Crâne
            ['region_id' => 3, 'avantage_id' => 4],
            ['region_id' => 3, 'avantage_id' => 8],
            ['region_id' => 3, 'avantage_id' => 10],
            ['region_id' => 3, 'avantage_id' => 18],
            ['region_id' => 3, 'avantage_id' => 19],
            ['region_id' => 3, 'avantage_id' => 18],


        ];

        // Insérer les données dans la table des régions
        foreach ($regions_avantages as $region_avantage) {
            BolRegionAvantage::create($region_avantage);
        }
    }
}
