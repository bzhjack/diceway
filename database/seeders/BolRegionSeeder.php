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
            ['id'=> 11 , 'name'=> 'Oomis'],
            ['id'=> 12 , 'name'=> 'Parsool'],
            ['id'=> 13 , 'name'=> 'Plaines de Klaar'],
            ['id'=> 14 , 'name'=> 'Satarla'],
            ['id'=> 15 , 'name'=> 'Shamballah'],
            ['id'=> 16 , 'name'=> 'Terres Désolées'],
            ['id'=> 17 , 'name'=> 'Tyrus'],
            ['id'=> 18 , 'name'=> 'Urceb'],
            ['id'=> 19 , 'name'=> 'Valgard'],
            ['id'=> 20 , 'name'=> 'Zalut'],
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
