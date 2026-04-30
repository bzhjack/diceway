<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\Schema;
use App\Models\Bol\BolRegion;
use Illuminate\Database\Seeder;

class BolRegionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // langue_native_id : ID de la langue native (null = lémurien uniquement)
        // premiere_carriere_id : carrière obligatoire en première position
        // carrieres_requises : carrières obligatoires (JSON array d’IDs)
        // carrieres_interdites : carrières interdites (JSON array d’IDs)
        $regions = [
            [‘id’ =>  1, ‘region’ => ‘Côte de Feu’],
            [‘id’ =>  2, ‘region’ => ‘Désert de Beshaar’,          ‘langue_native_id’ => 3,  ‘premiere_carriere_id’ => 3],
            [‘id’ =>  3, ‘region’ => ‘Halakh’,                     ‘langue_native_id’ => 3],
            [‘id’ =>  4, ‘region’ => ‘Îles du Crâne’,              ‘langue_native_id’ => 1,  ‘carrieres_requises’ => json_encode([13])],
            [‘id’ =>  5, ‘region’ => ‘Jungle de Qo et jungle de Qush’],
            [‘id’ =>  6, ‘region’ => ‘Lysor’],
            [‘id’ =>  7, ‘region’ => ‘Malakut’,                    ‘langue_native_id’ => 10],
            [‘id’ =>  8, ‘region’ => ‘Marais de Festrel’,          ‘langue_native_id’ => 6],
            [‘id’ =>  9, ‘region’ => ‘Marais de Kasht’,            ‘langue_native_id’ => 8],
            [‘id’ => 10, ‘region’ => ‘Montagnes de l’Axos’,       ‘langue_native_id’ => 2,  ‘premiere_carriere_id’ => 3],
            [‘id’ => 11, ‘region’ => ‘Oomis’],
            [‘id’ => 12, ‘region’ => ‘Parsool’],
            [‘id’ => 13, ‘region’ => ‘Plaines de Klaar’,           ‘langue_native_id’ => 4,  ‘premiere_carriere_id’ => 3, ‘carrieres_interdites’ => json_encode([1, 14, 22, 24])],
            [‘id’ => 14, ‘region’ => ‘Satarla’],
            [‘id’ => 15, ‘region’ => ‘Shamballah’,                 ‘langue_native_id’ => 11],
            [‘id’ => 16, ‘region’ => ‘Terres Désolées’],
            [‘id’ => 17, ‘region’ => ‘Tyrus’],
            [‘id’ => 18, ‘region’ => ‘Urceb’],
            [‘id’ => 19, ‘region’ => ‘Valgard’,                    ‘langue_native_id’ => 13, ‘carrieres_requises’ => json_encode([3])],
            [‘id’ => 20, ‘region’ => ‘Zalut’],
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
