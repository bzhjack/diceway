<?php

namespace Database\Seeders;

use App\Models\Bol\BolArmure;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BolArmureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        // Vide la table avant d'ajouter de nouveaux éléments
        BolArmure::truncate();

        // Nouveaux éléments à insérer avec ID
        $armures = [
            [
                'id' => 2,
                'armure' => 'Armure légère',
                'protection' => 'd6-3(1)',
                'malus' => 'Social (sauf si dissimulée)',
                'pts_de_pouvoir' => '+1',
            ],
            [
                'id' => 3,
                'armure' => 'Armure moyenne',
                'protection' => 'd6-2(2)',
                'malus' => 'Social / -1 en agilité',
                'pts_de_pouvoir' => '+2',
            ],
            [
                'id' => 4,
                'armure' => 'Armure lourde',
                'protection' => 'd6-1(3)',
                'malus' => 'Social / -2 en agilité',
                'pts_de_pouvoir' => '+3',
            ],
            [
                'id' => 5,
                'armure' => 'Casque',
                'protection' => '+1 à l\'armure',
                'malus' => 'Social / -1 en initiative',
            ],
            [
                'id' => 6,
                'armure' => 'Petit bouclier',
                'protection' => 'Malus -1 à un jet d\'attaque',
            ],
            [
                'id' => 7,
                'armure' => 'Grand bouclier',
                'protection' => 'Malus -1 à tout les jets d\'attaques',
                'malus' => '-1 en agilité',
            ],
        ];

        // Insère les nouveaux éléments
        foreach ($armures as $armure) {
            BolArmure::create($armure);
        }
    }
}
