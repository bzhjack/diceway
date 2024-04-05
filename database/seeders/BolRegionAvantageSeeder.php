<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class BolRegionAvantageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions_avantages = [
            // Désert de Beshaar
            ['id_region' => 1, 'id_avantage' => 2],
            ['id_region' => 1, 'id_avantage' => 6],
            ['id_region' => 1, 'id_avantage' => 9],
            ['id_region' => 1, 'id_avantage' => 11],
            ['id_region' => 1, 'id_avantage' => 35],
            ['id_region' => 1, 'id_avantage' => 46],
            ['id_region' => 1, 'id_avantage' => 58],
            ['id_region' => 1, 'id_avantage' => 59],
        ];

        // Insérer les données dans la table des régions
        foreach ($regions_avantages as $region_avantage) {
            BolRegionAvantageSeeder::create($region_avantage);
        }
    }
}
