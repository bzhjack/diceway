<?php

namespace Database\Seeders;

use App\Models\Bol\BolCreature;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class BolCreatureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $creatures = [
            [
                'id' => '1',
                'nom' => 'Andrak',
                'vigueur' => '4',
                'agilite' => '2',
                'esprit' => '0',
                'vitalite' => '20',
                'attaque' => '+3',
                'defense' => '2',
                'degat' => 'd6B',
                'protection' => 'd6-3 (1)',
                'id_taille' => '5',  // Grande
            ],
            [
                'id' => '2',
                'nom' => 'Anguille chasseresse',
                'vigueur' => '3',
                'agilite' => '1',
                'esprit' => '0',
                'vitalite' => '20',
                'attaque' => '+1',
                'defense' => '0',
                'degat' => 'd6',
                'protection' => '0',
                'id_taille' => '5',  // Grande
            ],
            [
                'id' => '3',
                'nom' => 'Azhdarkho',
                'vigueur' => '5',
                'agilite' => '1',
                'esprit' => '-2',
                'vitalite' => '25',
                'attaque' => '+2',
                'defense' => '2',
                'degat' => 'd6B',
                'protection' => 'd6-3 (1)',
                'id_taille' => '6',  // Très grande
            ],
            [
                'id' => '4',
                'nom' => 'Banth',
                'vigueur' => '8',
                'agilite' => '-3',
                'esprit' => '-2',
                'vitalite' => '40',
                'attaque' => '+0',
                'defense' => '0',
                'degat' => 'd6 x2',
                'protection' => 'd6 (4)',
                'id_taille' => '7',  // Enorme
            ],
            [
                'id' => '5',
                'nom' => 'Béhémathon',
                'vigueur' => '18',
                'agilite' => '-4',
                'esprit' => '-2',
                'vitalite' => '100',
                'attaque' => '+0',
                'defense' => '0',
                'degat' => 'd6B x4',
                'protection' => 'd6 (4)',
                'id_taille' => '12',  // Monstrueuse
            ],
            [
                'id' => '6',
                'nom' => 'Bubalus',
                'vigueur' => '5',
                'agilite' => '-2',
                'esprit' => '-2',
                'vitalite' => '20',
                'attaque' => '+0',
                'defense' => '0',
                'degat' => 'd6B',
                'protection' => 'd6-3 (1)',
                'id_taille' => '5',  // Grande
            ],
            [
                'id' => '7',
                'nom' => 'Bronyx',
                'vigueur' => '6',
                'agilite' => '1',
                'esprit' => '-1',
                'vitalite' => '30',
                'attaque' => '+2',
                'defense' => '0',
                'degat' => 'd6B',
                'protection' => 'd6-2 (2)',
                'id_taille' => '6',  // Très grande
            ],
            [
                'id' => '8',
                'nom' => 'Cathgan',
                'vigueur' => '-2',
                'agilite' => '2',
                'esprit' => '-4',
                'vitalite' => '2',
                'attaque' => '+3',
                'defense' => '4',
                'degat' => 'd3',
                'protection' => '0',
                'id_taille' => '1',  // Très petite
            ],
            [
                'id' => '9',
                'nom' => 'Chark',
                'vigueur' => '10',
                'agilite' => '0',
                'esprit' => '-1',
                'vitalite' => '50',
                'attaque' => '+3',
                'defense' => '0',
                'degat' => 'd6B x2',
                'protection' => 'd6-1 (3)',
                'id_taille' => '8',  // Massive
            ],
            [
                'id' => '10',
                'nom' => 'Coursier des sables',
                'vigueur' => '3',
                'agilite' => '2',
                'esprit' => '-2',
                'vitalite' => '12',
                'attaque' => '+1',
                'defense' => '2',
                'degat' => 'd6',
                'protection' => '0',
                'id_taille' => '5',  // Grande
            ],
            [
                'id' => '11',
                'nom' => 'Crocator',
                'vigueur' => '4',
                'agilite' => '1 (-1* au sol)',
                'esprit' => '-2',
                'vitalite' => '20',
                'attaque' => '+2',
                'defense' => '0',
                'degat' => 'd6B',
                'protection' => 'd6-2 (2)',
                'id_taille' => '5',  // Grande
            ],
            [
                'id' => '12',
                'nom' => 'Dinohyus',
                'vigueur' => '8',
                'agilite' => '-2',
                'esprit' => '-2',
                'vitalite' => '40',
                'attaque' => '+1',
                'defense' => '0',
                'degat' => 'd6 x2',
                'protection' => 'd6-2 (2)',
                'id_taille' => '7',  // Enorme
            ],
            [
                'id' => '13',
                'nom' => 'Deodarg',
                'vigueur' => '10',
                'agilite' => '2',
                'esprit' => '1',
                'vitalite' => '55',
                'attaque' => '+3',
                'defense' => '4',
                'degat' => 'd6B x2',
                'protection' => 'd6 (4)',
                'id_taille' => '8',  // Massive
            ],
            [
                'id' => '14',
                'nom' => 'Dracophon',
                'vigueur' => '7',
                'agilite' => '0',
                'esprit' => '-3',
                'vitalite' => '35',
                'attaque' => '+1',
                'defense' => '1',
                'degat' => 'd6B',
                'protection' => 'd6-3 (1)',
                'id_taille' => '6',  // Très grande

            ],
            [
                'id' => '15',
                'nom' => 'Drakk',
                'vigueur' => '9',
                'agilite' => '0',
                'esprit' => '-2',
                'vitalite' => '45',
                'attaque' => '+3',
                'defense' => '3',
                'degat' => 'd6B x2',
                'protection' => 'd6-3 (1)',
                'id_taille' => '8',  // Massive

            ],
            [
                'id' => '16',
                'nom' => 'Elasmotherium',
                'vigueur' => '10',
                'agilite' => '-3',
                'esprit' => '-2',
                'vitalite' => '45',
                'attaque' => '+1',
                'defense' => '0',
                'degat' => 'd6B x2',
                'protection' => 'd6-1 (3)',
                'id_taille' => '8',  // Massive
            ],
            [
                'id' => '17',
                'nom' => 'Eldaphon',
                'vigueur' => '11',
                'agilite' => '-2',
                'esprit' => '-2',
                'vitalite' => '50',
                'attaque' => '+0',
                'defense' => '0',
                'degat' => 'd6B x2',
                'protection' => 'd6-2 (2)',
                'id_taille' => '8',  // Massive
            ],
            [
                'id' => '18',
                'nom' => 'Fangeux',
                'vigueur' => '2',
                'agilite' => '1 (-1* au sol)',
                'esprit' => '-1',
                'vitalite' => '20',
                'attaque' => '(x2) +2 (+0 au sol)',
                'defense' => '1 (0*)',
                'degat' => '*',
                'protection' => '0',
                'id_taille' => '5',  // Grande
            ],
            [
                'id' => '19',
                'nom' => 'Frossor',
                'vigueur' => '0',
                'agilite' => '-1',
                'esprit' => '-1',
                'vitalite' => '5',
                'attaque' => '+0',
                'defense' => '0',
                'degat' => 'd6M',
                'protection' => '0',
                'id_taille' => '2',  // Petite

            ],
            [
                'id' => '20',
                'nom' => 'Ganuc',
                'vigueur' => '-3',
                'agilite' => '2',
                'esprit' => '-3',
                'vitalite' => '1',
                'attaque' => '+1',
                'defense' => '0',
                'degat' => '1',
                'protection' => '0',
                'id_taille' => '0',  // Minuscule

            ],
            [
                'id' => '21',
                'nom' => 'Jemadar',
                'vigueur' => '6',
                'agilite' => '1',
                'esprit' => '0',
                'vitalite' => '30',
                'attaque' => '+4',
                'defense' => '3',
                'degat' => 'd6B x2',
                'protection' => 'd6-2 (2)',
                'id_taille' => '7',  // Très grande

            ],
            [
                'id' => '22',
                'nom' => 'Jit',
                'vigueur' => '-4',
                'agilite' => '4',
                'esprit' => '-4',
                'vitalite' => '1',
                'attaque' => '+2',
                'defense' => '5',
                'degat' => '1',
                'protection' => '0',
                'id_taille' => '0',  // Minuscule

            ],
            [
                'id' => '23',
                'nom' => 'Kalathorn',
                'vigueur' => '14',
                'agilite' => '-1',
                'esprit' => '-2',
                'vitalite' => '70',
                'attaque' => '+1',
                'defense' => '0',
                'degat' => 'd6B x3',
                'protection' => 'd6-1 (3)',
                'id_taille' => '12',  // Gigantesque

            ],
            [
                'id' => '24',
                'nom' => 'Kroark',
                'vigueur' => '4',
                'agilite' => '1',
                'esprit' => '-2',
                'vitalite' => '15',
                'attaque' => '+2',
                'defense' => '2',
                'degat' => 'd6B',
                'protection' => 'd6-3 (1)',
                'id_taille' => '5',  // Grande
            ],
            [
                'id' => '25',
                'nom' => 'Kyphus',
                'vigueur' => '-2',
                'agilite' => '0',
                'esprit' => '-2',
                'vitalite' => '2',
                'attaque' => '+1',
                'defense' => '0',
                'degat' => 'd6-2',
                'protection' => '0',
                'id_taille' => '2',  // Très petite
            ],
            [
                'id' => '26',
                'nom' => 'Loup',
                'vigueur' => '1',
                'agilite' => '2',
                'esprit' => '-1',
                'vitalite' => '10',
                'attaque' => '+3',
                'defense' => '1',
                'degat' => 'd6',
                'protection' => '0',
                'id_taille' => '4',  // Moyenne
            ],
            [
                'id' => '27',
                'nom' => 'Loup géant',
                'vigueur' => '4',
                'agilite' => '1',
                'esprit' => '-1',
                'vitalite' => '20',
                'attaque' => '+2',
                'defense' => '0',
                'degat' => 'd6B',
                'protection' => 'd6-3 (1)',
                'id_taille' => '5',  // Grande
            ],
            [
                'id' => '28',
                'nom' => 'Mythunga',
                'vigueur' => '7',
                'agilite' => '1',
                'esprit' => '0',
                'vitalite' => '35',
                'attaque' => '+4',
                'defense' => '2',
                'degat' => 'd6B',
                'protection' => '0',
                'id_taille' => '9',  // Énorme
            ],
            [
                'id' => '29',
                'nom' => 'Ours des cavernes / ours polaire',
                'vigueur' => '8',
                'agilite' => '0',
                'esprit' => '-1',
                'vitalite' => '40',
                'attaque' => '+2',
                'defense' => '1',
                'degat' => 'd6 x2',
                'protection' => 'd6-2 (2)',
                'id_taille' => '9',  // Énorme
            ],
            [
                'id' => '30',
                'nom' => 'Phong',
                'vigueur' => '-1',
                'agilite' => '3',
                'esprit' => '-2',
                'vitalite' => '3',
                'attaque' => '+2',
                'defense' => '3',
                'degat' => 'd6M',
                'protection' => '0',
                'id_taille' => '2',  // Petite
            ],
            [
                'id' => '31',
                'nom' => 'Parvalus',
                'vigueur' => '4',
                'agilite' => '1',
                'esprit' => '-2',
                'vitalite' => '15',
                'attaque' => '+0',
                'defense' => '0',
                'degat' => 'd6',
                'protection' => '0',
                'id_taille' => '5',  // Grande
            ],
            [
                'id' => '32',
                'nom' => 'Phororacos',
                'vigueur' => '4',
                'agilite' => '-1',
                'esprit' => '-1',
                'vitalite' => '30',
                'attaque' => '+2',
                'defense' => '0',
                'degat' => 'd6B',
                'protection' => '0',
                'id_taille' => '6',  // Très grande
            ],
            [
                'id' => '33',
                'nom' => 'Poad',
                'vigueur' => '12',
                'agilite' => '0',
                'esprit' => '-1',
                'vitalite' => '60',
                'attaque' => '+2',
                'defense' => '0',
                'degat' => 'd6 x3',
                'protection' => 'd6-2 (2)',
                'id_taille' => '10',  // Colossale
            ],
            [
                'id' => '34',
                'nom' => 'Purgat',
                'vigueur' => '-1',
                'agilite' => '1',
                'esprit' => '0',
                'vitalite' => '3',
                'attaque' => '+1',
                'defense' => '1',
                'degat' => 'd6M',
                'protection' => '0',
                'id_taille' => '2',  // Petite
            ],
            [
                'id' => '35',
                'nom' => 'Sardolith',
                'vigueur' => '14',
                'agilite' => '-2',
                'esprit' => '-2',
                'vitalite' => '70',
                'attaque' => '+0',
                'defense' => '0',
                'degat' => 'd6 x3',
                'protection' => 'd6 (4)',
                'id_taille' => '10',  // Gigantesque
            ],
            [
                'id' => '36',
                'nom' => 'Scorpion-araignée',
                'vigueur' => '0',
                'agilite' => '0',
                'esprit' => '-2',
                'vitalite' => '8',
                'attaque' => '+2 (pinces), +0 (dard)',
                'defense' => '0',
                'degat' => 'd6M (pinces), d3 + poison (dard)',
                'protection' => 'd6-2 (2)',
                'id_taille' => '4',  // Moyenne
            ],
            [
                'id' => '37',
                'nom' => 'Scorpion-araignée géant',
                'vigueur' => '10',
                'agilite' => '-1',
                'esprit' => '-1',
                'vitalite' => '60',
                'attaque' => '+3 (pinces), +1 (dard)',
                'defense' => '0',
                'degat' => 'd6 x2 (pinces), d6 + poison (dard)',
                'protection' => 'd6 (4)',
                'id_taille' => '11',  // Colossale
            ],
            [
                'id' => '38',
                'nom' => 'Singe des neiges',
                'vigueur' => '5',
                'agilite' => '0',
                'esprit' => '-1',
                'vitalite' => '15',
                'attaque' => '+1',
                'defense' => '1',
                'degat' => 'd6B',
                'protection' => '0',
                'id_taille' => '5',  // Grande
            ],
            [
                'id' => '39',
                'nom' => 'Triotaur',
                'vigueur' => '7',
                'agilite' => '-2',
                'esprit' => '-2',
                'vitalite' => '30',
                'attaque' => '+2',
                'defense' => '0',
                'degat' => 'd6B',
                'protection' => 'd6-1 (3)',
                'id_taille' => '6',  // Très grande
            ],
            [
                'id' => '40',
                'nom' => 'Ursavus',
                'vigueur' => '0',
                'agilite' => '1',
                'esprit' => '-1',
                'vitalite' => '10',
                'attaque' => '+2',
                'defense' => '0',
                'degat' => 'd6',
                'protection' => '0',
                'id_taille' => '4',  // Moyenne
            ],
            [
                'id' => '41',
                'nom' => 'Uzeg',
                'vigueur' => '-1',
                'agilite' => '2',
                'esprit' => '-1',
                'vitalite' => '5',
                'attaque' => '+2',
                'defense' => '3',
                'degat' => 'd6M',
                'protection' => '0',
                'id_taille' => '2',  // Petite
            ],
            [
                'id' => '42',
                'nom' => 'Venator',
                'vigueur' => '0',
                'agilite' => '2',
                'esprit' => '-2',
                'vitalite' => '10',
                'attaque' => '+3',
                'defense' => '2',
                'degat' => 'd6',
                'protection' => '0',
                'id_taille' => '4',  // Moyenne
            ],
            [
                'id' => '43',
                'nom' => 'Ver des glaces',
                'vigueur' => '3',
                'agilite' => '0',
                'esprit' => '1',
                'vitalite' => '10',
                'attaque' => '+0',
                'defense' => '0',
                'degat' => 'd6',
                'protection' => 'd6-3 (1)',
                'id_taille' => '4',  // Moyenne
            ],
            [
                'id' => '44',
                'nom' => 'Xolag',
                'vigueur' => '2',
                'agilite' => '-1',
                'esprit' => '-2',
                'vitalite' => '8',
                'attaque' => '+1 (x2)',
                'defense' => '0',
                'degat' => 'd6M',
                'protection' => '0',
                'id_taille' => '4',  // Moyenne
            ],
            [
                'id' => '45',
                'nom' => 'Xolth',
                'vigueur' => '16',
                'agilite' => '-3',
                'esprit' => '-3',
                'vitalite' => '85',
                'attaque' => '+1',
                'defense' => '0',
                'degat' => 'spécial',
                'protection' => 'd6 (4)',
                'id_taille' => '12',  // Immense
            ],
            [
                'id' => '46',
                'nom' => 'Yorth',
                'vigueur' => '4',
                'agilite' => '2',
                'esprit' => '-1',
                'vitalite' => '20',
                'attaque' => '+3',
                'defense' => '2',
                'degat' => 'd6B',
                'protection' => 'd6-3 (1)',
                'id_taille' => '5',  // Grande
            ],
            [
                'id' => '47',
                'nom' => 'Zathog',
                'vigueur' => '8',
                'agilite' => '-1',
                'esprit' => '-2',
                'vitalite' => '40',
                'attaque' => '+2',
                'defense' => '0',
                'degat' => 'd6 x2',
                'protection' => 'd6-2 (2)',
                'id_taille' => '6',  // Énorme
            ]
        ];

        Schema::disableForeignKeyConstraints();
        BolCreature::whereNull('user_id')->delete();
        Schema::enableForeignKeyConstraints();
        // Insérer les données dans la table des régions
        foreach ($creatures as $creature) {
            BolCreature::create($creature);
        }
    }
}
