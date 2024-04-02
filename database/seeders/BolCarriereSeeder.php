<?php

namespace Database\Seeders;

use App\Models\BolCarriere;
use Illuminate\Database\Seeder;

class BolCarriereSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $regions = [
            ['id'=> 1 , 'name' => 'Désert de Beshaar'],
            ['id'=> 2 , 'name' => 'Halakh'],
            ['id'=> 3 , 'name'=> 'Jungle de Qo et jungle de Qush'],
            ['id'=> 4 , 'name'=> 'Lysor'],
            ['id'=> 5 , 'name'=> 'Malakut'],
            ['id'=> 6 , 'name'=> 'Marais de Festrel'],
            ['id'=> 7 , 'name'=> 'Marais de Kasht'],
            ['id'=> 8 , 'name'=> 'Montagnes de l’Axos'],
            ['id'=> 9 , 'name'=> 'Parsool'],
            ['id'=> 10 , 'name'=> 'Plaines de Klaar'],
            ['id'=> 11 , 'name'=> 'Satarla'],
            ['id'=> 12 , 'name'=> 'Shamballah'],
            ['id'=> 13 , 'name'=> 'Terres Désolées'],
            ['id'=> 14 , 'name'=> 'Tyrus'],
            ['id'=> 15 , 'name'=> 'Urceb'],
            ['id'=> 16 , 'name'=> 'Valgard'],
            ['id'=> 17 , 'name'=> 'Parsool'],
            ['id'=> 18 , 'name'=> 'Zalut'],
            // Ajoutez d'autres régions selon vos besoins
        ];

        // Insérer les données dans la table des régions
        foreach ($regions as $region) {
            BolCarriere::create($region);
        }
    }
}
