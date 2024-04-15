<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\Schema;
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
            ['id'=> 1 , 'region' => 'Côte de Feu'],
            ['id'=> 2 , 'region' => 'Désert de Beshaar'],
            ['id'=> 3 , 'region' => 'Halakh'],
            ['id'=> 4 , 'region' => 'Îles du Crâne'],
            ['id'=> 5 , 'region'=> 'Jungle de Qo et jungle de Qush'],
            ['id'=> 6 , 'region'=> 'Lysor'],
            ['id'=> 7 , 'region'=> 'Malakut'],
            ['id'=> 8 , 'region'=> 'Marais de Festrel'],
            ['id'=> 9 , 'region'=> 'Marais de Kasht'],
            ['id'=> 10 , 'region'=> 'Montagnes de l’Axos'],
            ['id'=> 11 , 'region'=> 'Oomis'],
            ['id'=> 12 , 'region'=> 'Parsool'],
            ['id'=> 13 , 'region'=> 'Plaines de Klaar'],
            ['id'=> 14 , 'region'=> 'Satarla'],
            ['id'=> 15 , 'region'=> 'Shamballah'],
            ['id'=> 16 , 'region'=> 'Terres Désolées'],
            ['id'=> 17 , 'region'=> 'Tyrus'],
            ['id'=> 18 , 'region'=> 'Urceb'],
            ['id'=> 19 , 'region'=> 'Valgard'],
            ['id'=> 20 , 'region'=> 'Zalut'],
            // Ajoutez d'autres régions selon vos besoins
        ];
        Schema::disableForeignKeyConstraints();
        BolRegion::truncate();
        Schema::enableForeignKeyConstraints();
        // Insérer les données dans la table des régions
        foreach ($regions as $region) {
            BolRegion::create($region);
        }
    }
}
