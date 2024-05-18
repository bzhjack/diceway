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
                'id' => 1,
                'armure' => 'Pas d’armure',
                'protection' => '0',
                'malus' => '-',
            ],
            [
                'id' => 2,
                'armure' => 'Armure légère',
                'protection' => 'annule d6-3 (1) dégâts subis',
                'malus' => 'Social (sauf si dissimulée)',
                'pts_de_pouvoir' => '+1',
            ],
            [
                'id' => 3,
                'armure' => 'Armure moyenne',
                'protection' => 'annule d6-2 (2) dégâts subis',
                'malus' => 'Social / -1 en agilité',
                'pts_de_pouvoir' => '+2',
            ],
            [
                'id' => 4,
                'armure' => 'Armure lourde',
                'protection' => 'annule d6-1 (3) dégâts subis',
                'malus' => 'Social / -2 en agilité',
                'pts_de_pouvoir' => '+3',
            ],
            [
                'id' => 5,
                'armure' => 'Casque',
                'protection' => '+1 à la protection de l’armure',
                'malus' => 'Social / -1 en initiative',
            ],
            [
                'id' => 6,
                'armure' => 'Petit bouclier',
                'protection' => 'Impose un malus de -1 à une attaque subie par round',
                'malus' => '-',
            ],
            [
                'id' => 7,
                'armure' => 'Grand bouclier',
                'protection' => 'Impose un malus de -1 à toutes les attaques subies par round -1 en agilité',
                'malus' => '-',
            ],
        ];

        // Insère les nouveaux éléments
        foreach ($armures as $armure) {
            BolArmure::create($armure);
        }
    }
}
