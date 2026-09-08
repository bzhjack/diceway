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
        // Le cas "Pas d’armure" de la table BoL est représenté dans le projet
        // par l’absence d’entrée d’équipement défensif sur le personnage.
        // Le baudrier de guerre reste un avantage, pas une armure seedée.
        BolArmure::truncate();

        $armures = [
            [
                'id' => 2,
                'armure' => 'Armure légère',
                'protection' => 'd6-3(1)',
                'malus' => 'Social (sauf si dissimulée)',
                'pts_de_pouvoir' => '+1',
                'categorie' => 'armure',
                'malus_agilite' => 0,
                'malus_initiative' => 0,
                'malus_attaque_subie' => 0,
                'malus_attaque_subie_portee' => null,
            ],
            [
                'id' => 3,
                'armure' => 'Armure moyenne',
                'protection' => 'd6-2(2)',
                'malus' => 'Social / Agilité -1',
                'pts_de_pouvoir' => '+2',
                'categorie' => 'armure',
                'malus_agilite' => 1,
                'malus_initiative' => 0,
                'malus_attaque_subie' => 0,
                'malus_attaque_subie_portee' => null,
            ],
            [
                'id' => 4,
                'armure' => 'Armure lourde',
                'protection' => 'd6-1(3)',
                'malus' => 'Social / Agilité -2',
                'pts_de_pouvoir' => '+3',
                'categorie' => 'armure',
                'malus_agilite' => 2,
                'malus_initiative' => 0,
                'malus_attaque_subie' => 0,
                'malus_attaque_subie_portee' => null,
            ],
            [
                'id' => 5,
                'armure' => 'Casque',
                'protection' => '+1 à l\'armure',
                'malus' => 'Social / Initiative -1',
                'categorie' => 'casque',
                'malus_agilite' => 0,
                'malus_initiative' => 1,
                'malus_attaque_subie' => 0,
                'malus_attaque_subie_portee' => null,
            ],
            [
                'id' => 6,
                'armure' => 'Petit bouclier',
                'protection' => 'Impose un malus de -1 à une attaque subie par round',
                'categorie' => 'bouclier',
                'malus_agilite' => 0,
                'malus_initiative' => 0,
                'malus_attaque_subie' => 1,
                'malus_attaque_subie_portee' => 'une',
            ],
            [
                'id' => 7,
                'armure' => 'Grand bouclier',
                'protection' => 'Impose un malus de -1 à toutes les attaques subies par round',
                'malus' => 'Agilité -1',
                'categorie' => 'bouclier',
                'malus_agilite' => 1,
                'malus_initiative' => 0,
                'malus_attaque_subie' => 1,
                'malus_attaque_subie_portee' => 'toutes',
            ],
        ];
        foreach ($armures as $armure) {
            BolArmure::create($armure);
        }
    }
}
