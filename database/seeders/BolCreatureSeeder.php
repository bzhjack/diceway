<?php

namespace Database\Seeders;

use App\Models\Bol\BolCreature;
use App\Models\Bol\BolCreatureCapacite;
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
                'attaque' => '3',
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
                'attaque' => '1',
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
                'attaque' => '2',
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
                'attaque' => '0',
                'defense' => '0',
                'degat' => 'd6x2',
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
                'attaque' => '0',
                'defense' => '0',
                'degat' => 'd6Bx4',
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
                'attaque' => '0',
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
                'attaque' => '2',
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
                'attaque' => '3',
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
                'attaque' => '3',
                'defense' => '0',
                'degat' => 'd6Bx2',
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
                'attaque' => '1',
                'defense' => '2',
                'degat' => 'd6',
                'protection' => '0',
                'id_taille' => '5',  // Grande
            ],
            [
                'id' => '11',
                'nom' => 'Crocator',
                'vigueur' => '4',
                'agilite' => '1',
                'esprit' => '-2',
                'vitalite' => '20',
                'attaque' => '2',
                'defense' => '0',
                'degat' => 'd6B',
                'protection' => 'd6-2 (2)',
                'id_taille' => '5',  // Grande
                'commentaire' => 'Environnement naturel : marais, rivières. Sur la terre ferme: agilité de -1'
            ],
            [
                'id' => '12',
                'nom' => 'Dinohyus',
                'vigueur' => '8',
                'agilite' => '-2',
                'esprit' => '-2',
                'vitalite' => '40',
                'attaque' => '1',
                'defense' => '0',
                'degat' => 'd6x2',
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
                'attaque' => '3',
                'defense' => '4',
                'degat' => 'd6Bx2',
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
                'attaque' => '1',
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
                'attaque' => '3',
                'defense' => '3',
                'degat' => 'd6Bx2',
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
                'attaque' => '1',
                'defense' => '0',
                'degat' => 'd6Bx2',
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
                'attaque' => '0',
                'defense' => '0',
                'degat' => 'd6Bx2',
                'protection' => 'd6-2 (2)',
                'id_taille' => '8',  // Massive
            ],
            [
                'id' => '18',
                'nom' => 'Fangeux',
                'vigueur' => '2',
                'agilite' => '1',
                'esprit' => '-1',
                'vitalite' => '20',
                'attaque' => '2',
                'defense' => '1',
                'degat' => '0',
                'protection' => '0',
                'id_taille' => '5',  // Grande
                'commentaire' => 'Environnement naturel : rivières, Sur la terre ferme : agilité -1 ,défence 0 et attaque 0'
            ],
            [
                'id' => '19',
                'nom' => 'Frossor',
                'vigueur' => '0',
                'agilite' => '-1',
                'esprit' => '-1',
                'vitalite' => '5',
                'attaque' => '0',
                'defense' => '0',
                'degat' => 'd6M',
                'protection' => '0',
                'id_taille' => '3',  // Petite

            ],
            [
                'id' => '20',
                'nom' => 'Ganuc',
                'vigueur' => '-3',
                'agilite' => '2',
                'esprit' => '-3',
                'vitalite' => '1',
                'attaque' => '1',
                'defense' => '0',
                'degat' => '1',
                'protection' => '0',
                'id_taille' => '1',  // Minuscule

            ],
            [
                'id' => '21',
                'nom' => 'Jemadar',
                'vigueur' => '6',
                'agilite' => '1',
                'esprit' => '0',
                'vitalite' => '30',
                'attaque' => '4',
                'defense' => '3',
                'degat' => 'd6Bx2',
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
                'attaque' => '2',
                'defense' => '5',
                'degat' => '1',
                'protection' => '0',
                'id_taille' => '1',  // Minuscule

            ],
            [
                'id' => '23',
                'nom' => 'Kalathorn',
                'vigueur' => '14',
                'agilite' => '-1',
                'esprit' => '-2',
                'vitalite' => '70',
                'attaque' => '1',
                'defense' => '0',
                'degat' => 'd6Bx3',
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
                'attaque' => '2',
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
                'attaque' => '1',
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
                'attaque' => '3',
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
                'attaque' => '2',
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
                'attaque' => '4',
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
                'attaque' => '2',
                'defense' => '1',
                'degat' => 'd6x2',
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
                'attaque' => '2',
                'defense' => '3',
                'degat' => 'd6M',
                'protection' => '0',
                'id_taille' => '3',  // Petite
            ],
            [
                'id' => '31',
                'nom' => 'Parvalus',
                'vigueur' => '4',
                'agilite' => '1',
                'esprit' => '-2',
                'vitalite' => '15',
                'attaque' => '0',
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
                'attaque' => '2',
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
                'attaque' => '2',
                'defense' => '0',
                'degat' => 'd6x3',
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
                'attaque' => '1',
                'defense' => '1',
                'degat' => 'd6M',
                'protection' => '0',
                'id_taille' => '3',  // Petite
            ],
            [
                'id' => '35',
                'nom' => 'Sardolith',
                'vigueur' => '14',
                'agilite' => '-2',
                'esprit' => '-2',
                'vitalite' => '70',
                'attaque' => '0',
                'defense' => '0',
                'degat' => 'd6x3',
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
                'attaque' => '2',
                'defense' => '0',
                'degat' => 'd6M',
                'protection' => 'd6-2 (2)',
                'id_taille' => '4',  // Moyenne
                'commentaire' => 'Attaque: 2 (pinces) 0 (dard). Dégâts : d6M(pinces) d3 + poison (dard)'
            ],
            [
                'id' => '37',
                'nom' => 'Scorpion-araignée géant',
                'vigueur' => '10',
                'agilite' => '-1',
                'esprit' => '-1',
                'vitalite' => '60',
                'attaque' => '3',
                'defense' => '0',
                'degat' => 'd6x2',
                'protection' => 'd6 (4)',
                'id_taille' => '11',  // Colossale
                'commentaire' => 'Attaque:  3 (pinces) 1 (dard). Dégâts : d6x2(pinces) d6 + poison (dard)'
            ],
            [
                'id' => '38',
                'nom' => 'Singe des neiges',
                'vigueur' => '5',
                'agilite' => '0',
                'esprit' => '-1',
                'vitalite' => '15',
                'attaque' => '1',
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
                'attaque' => '2',
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
                'attaque' => '2',
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
                'attaque' => '2',
                'defense' => '3',
                'degat' => 'd6M',
                'protection' => '0',
                'id_taille' => '3',  // Petite
            ],
            [
                'id' => '42',
                'nom' => 'Venator',
                'vigueur' => '0',
                'agilite' => '2',
                'esprit' => '-2',
                'vitalite' => '10',
                'attaque' => '3',
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
                'attaque' => '0',
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
                'attaque' => '1',
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
                'attaque' => '1',
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
                'attaque' => '3',
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
                'attaque' => '2',
                'defense' => '0',
                'degat' => 'd6x2',
                'protection' => 'd6-2 (2)',
                'id_taille' => '6',  // Énorme
            ]
        ];

        BolCreature::whereNull('user_id')->delete();
        // Insérer les données dans la table des régions
        foreach ($creatures as $creature) {
            BolCreature::create($creature);
        }

        $capacites = [
            [
                'id' => '1',
                'creature_id' => '1',
                'capacite_id' => '6',
                'detail' => null
            ],
            [
                'id' => '2',
                'creature_id' => '2',
                'capacite_id' => '6',
                'detail' => 'Capable de percevoir les mouvements dans l’eau à plus d’un kilomètre de distance'
            ],
            [
                'id' => '3',
                'creature_id' => '2',
                'capacite_id' => '3',
                'detail' => 'Assomme sa proie avec une puissante décharge. Un héros doit réussir un jet de vigueur difficile (-1), sinon il perd connaissance pour 6 moins sa vigueur en rounds.'
            ],
            [
                'id' => '4',
                'creature_id' => '3',
                'capacite_id' => '3',
                'detail' => 'Crachat gluant qui immobilise une créature qui échoue à un jet de vigueur très difficile (-4).'
            ],
            [
                'id' => '5',
                'creature_id' => '4',
                'capacite_id' => '7',
                'detail' => null
            ],
            [
                'id' => '6',
                'creature_id' => '4',
                'capacite_id' => '8',
                'detail' => 'Vision'
            ],
            [
                'id' => '7',
                'creature_id' => '5',
                'capacite_id' => '2',
                'detail' => 'Deux jets d’attaque par round.'
            ],
            [
                'id' => '8',
                'creature_id' => '8',
                'capacite_id' => '4',
                'detail' => 'Injecte un venin paralysant s’il inflige des dégâts. Un jet de vigueur difficile (-2) est nécessaire pour éviter la paralysie et la mort en une heure.Un autre jet de vigueur difficile peut être tenté pour éviter la mort.'
            ],
            [
                'id' => '9',
                'creature_id' => '11',
                'capacite_id' => '5',
                'detail' => 'quand il flotte immobile à fleur d’eau, le crocator est difficile à repérer.'
            ],
            [
                'id' => '10',
                'creature_id' => '13',
                'capacite_id' => '1',
                'detail' => null
            ],
            [
                'id' => '11',
                'creature_id' => '13',
                'capacite_id' => '6',
                'detail' => null
            ],
            [
                'id' => '12',
                'creature_id' => '12',
                'capacite_id' => '1',
                'detail' => null
            ],
            [
                'id' => '13',
                'creature_id' => '18',
                'capacite_id' => '2',
                'detail' => 'Attaque deux fois pour attraper sa proie avec ses tentacules. Si les deux attaques touchent, il peut mordre. La victime peut se libérer avec un jet de vigueur difficile (-2) ou subir une morsure automatique au round suivant.'
            ],
            [
                'id' => '14',
                'creature_id' => '18',
                'capacite_id' => '4',
                'detail' => 'Le venin tue immédiatement une petite proie. Les héros doivent réussir un jet de vigueur très difficile (-4) chaque round pour survivre. En cas d\'échec, ils meurent en 3 rounds.'
            ],
            [
                'id' => '15',
                'creature_id' => '20',
                'capacite_id' => '4',
                'detail' => 'Le venin n\'affecte que les créatures de taille moyenne ou moins. La victime subit un malus de -1 à tous ses jets d\'action pendant une demi-journée, sauf si elle réussit un jet de vigueur moyen (0).'
            ],
            [
                'id' => '16',
                'creature_id' => '22',
                'capacite_id' => '3',
                'detail' => 'Sur un 1 au d6, la jit injecte des œufs. Si un médecin traite la plaie dans l’heure, il peut les retirer. Sinon, ils causent 1d6 dégâts s’ils sont extraits dans les 24 heures, ou 2d6 dégâts après ce délai.'
            ],
            [
                'id' => '17',
                'creature_id' => '30',
                'capacite_id' => '3',
                'detail' => 'Une phong qui mord une victime endormie lui aspire jusqu’à 4 points de vitalité, à raison de 1 point toutes les 5 minutes. Les victimes se rendent compte de l\'attaque seulement au réveil.'
            ],
            [
                'id' => '18',
                'creature_id' => '31',
                'capacite_id' => '7',
                'detail' => null
            ],
            [
                'id' => '19',
                'creature_id' => '32',
                'capacite_id' => '1',
                'detail' => 'Peut saisir une créature de taille moyenne ou moins dans son bec et l’écraser, ajoutant +2 aux dégâts.'
            ],
            [
                'id' => '20',
                'creature_id' => '35',
                'capacite_id' => '2',
                'detail' => 'Peut effectuer deux jets d’attaque contre la même cible ou contre des cibles différentes.'
            ],
            [
                'id' => '21',
                'creature_id' => '35',
                'capacite_id' => '4',
                'detail' => 'Le poison tue immédiatement les créatures de taille petite ou moins. Les autres doivent réussir un jet de vigueur très difficile (-6) ou tomber dans un coma de 1d6 jours mortel sans antidote.'
            ],
            [
                'id' => '22',
                'creature_id' => '36',
                'capacite_id' => '4',
                'detail' => 'Le venin paralyse les créatures de taille grande ou moins. Les héros doivent réussir un jet de vigueur ardu (-1) pour résister. Sinon, ils meurent dans l’heure, sauf s\'ils réussissent un second jet de vigueur ardu.'
            ],
            [
                'id' => '23',
                'creature_id' => '37',
                'capacite_id' => '4',
                'detail' => 'Le venin paralyse les créatures de taille immense ou moins. Les héros doivent réussir un jet de vigueur très difficile (-4) pour résister. Sinon, ils meurent dans l’heure, sauf s\'ils réussissent un second jet de vigueur très difficile.'
            ],
            [
                'id' => '24',
                'creature_id' => '38',
                'capacite_id' => '1',
                'detail' => null
            ],

            [
                'id' => '25',
                'creature_id' => '43',
                'capacite_id' => '7',
                'detail' => null
            ],
            [
                'id' => '26',
                'creature_id' => '43',
                'capacite_id' => '5',
                'detail' => null
            ],
            [
                'id' => '27',
                'creature_id' => '43',
                'capacite_id' => '3',
                'detail' => 'Brume somnifère qui affecte les créatures à 3 m devant lui. Les héros touchés subissent un malus de -2 aux jets d’attaque et se déplacent plus lentement. Au troisième round, ils doivent réussir un jet de vigueur ardu (-1) ou s’évanouir. Ils se réveillent en 5 minutes s’ils réussissent un jet de vigueur, sinon après une heure.'
            ],
            [
                'id' => '28',
                'creature_id' => '44',
                'capacite_id' => '2',
                'detail' => 'Effectue deux jets d’attaque.'
            ],
            [
                'id' => '29',
                'creature_id' => '45',
                'capacite_id' => '8',
                'detail' => 'Peur du feu.'
            ],
            [
                'id' => '30',
                'creature_id' => '45',
                'capacite_id' => '3',
                'detail' => 'Enveloppé par le xolth, un héros doit tuer le monstre pour s\'en sortir, subissant 1d6 dégâts par round passé à l\'intérieur.'
            ],
            [
                'id' => '31',
                'creature_id' => '47',
                'capacite_id' => '4',
                'detail' => 'Après une morsure faire un jet de vigueur difficile (-2). En cas d’échec, il subit 2 points de dégâts supplémentaires, puis 2 points de dégâts chaque round. Chaque point de vitalité perdu entraîne un malus de -1 aux jets. Si le héros tombe à 0 point de vitalité, il perd conscience et doit réussir un nouveau jet de vigueur difficile (-2). S\'il réussit, il reste stable mais ne reprend conscience qu’avec un jet de vigueur ardu (-1) chaque matin, ou après un soin médical (jet d\'action difficile -2) ou un antidote.'
            ],
        ];
        foreach ($capacites as $capacite) {
            BolCreatureCapacite::create($capacite);
        }
    }
}
