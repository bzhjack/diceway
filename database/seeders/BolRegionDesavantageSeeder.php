<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\BolRegionDesavantage;

class BolRegionDesavantageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions_desavantages = [
            // Désert de Beshaar
            ['region_id' => 1, 'desavantage_id' => 2],
            ['region_id' => 1, 'desavantage_id' => 6],
            ['region_id' => 1, 'desavantage_id' => 9],
        ];

        // Insérer les données dans la table des régions
        foreach ($regions_desavantages as $region_desavantage) {
            BolRegionDesavantage::create($region_desavantage);
        }
    }
}
