<?php

namespace Database\Seeders;

use App\Models\BolRegion;
use Illuminate\Database\Seeder;

class BolRegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions = [
            ['id'=> 1 , 'name' => 'Côte de Feu'],
            ['id'=> 2 , 'name' => 'Désert de Beshaar'],
            ['id'=> 3 , 'name' => 'Halakh'],
            ['id'=> 4 , 'name' => 'Îles du Crâne'],
            ['id'=> 5 , 'name'=> 'Jungle de Qo et jungle de Qush'],
            ['id'=> 6 , 'name'=> 'Lysor'],
            ['id'=> 7 , 'name'=> 'Malakut'],
            ['id'=> 8 , 'name'=> 'Marais de Festrel'],
            ['id'=> 9 , 'name'=> 'Marais de Kasht'],
            ['id'=> 10 , 'name'=> 'Montagnes de l’Axos'],
            ['id'=> 11 , 'name'=> 'Parsool'],
            ['id'=> 12 , 'name'=> 'Plaines de Klaar'],
            ['id'=> 13 , 'name'=> 'Satarla'],
            ['id'=> 14 , 'name'=> 'Shamballah'],
            ['id'=> 15 , 'name'=> 'Terres Désolées'],
            ['id'=> 16 , 'name'=> 'Tyrus'],
            ['id'=> 17 , 'name'=> 'Urceb'],
            ['id'=> 18 , 'name'=> 'Valgard'],
            ['id'=> 19 , 'name'=> 'Parsool'],
            ['id'=> 20 , 'name'=> 'Zalut'],
            // Ajoutez d'autres régions selon vos besoins
        ];

        // Insérer les données dans la table des régions
        foreach ($regions as $region) {
            BolRegion::create($region);
        }
    }
}
