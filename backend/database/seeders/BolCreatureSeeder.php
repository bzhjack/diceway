<?php

namespace Database\Seeders;

use App\Models\Bol\BolCreature;
use App\Models\Bol\BolCreatureCapacite;
use Illuminate\Database\Seeder;

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
                'degats' => 'd6B',
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
                'degats' => 'd6',
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
                'degats' => 'd6B',
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
                'degats' => 'd6x2',
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
                'degats' => 'd6Bx4',
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
                'degats' => 'd6B',
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
                'degats' => 'd6B',
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
                'degats' => 'd3',
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
                'degats' => 'd6Bx2',
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
                'degats' => 'd6',
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
                'degats' => 'd6B',
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
                'degats' => 'd6x2',
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
                'degats' => 'd6Bx2',
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
                'degats' => 'd6B',
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
                'degats' => 'd6Bx2',
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
                'degats' => 'd6Bx2',
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
                'degats' => 'd6Bx2',
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
                'degats' => '0',
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
                'degats' => 'd6M',
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
                'degats' => '1',
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
                'degats' => 'd6Bx2',
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
                'degats' => '1',
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
                'degats' => 'd6Bx3',
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
                'degats' => 'd6B',
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
                'degats' => 'd6-2',
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
                'degats' => 'd6',
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
                'degats' => 'd6B',
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
                'degats' => 'd6B',
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
                'degats' => 'd6x2',
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
                'degats' => 'd6M',
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
                'degats' => 'd6',
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
                'degats' => 'd6B',
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
                'degats' => 'd6x3',
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
                'degats' => 'd6M',
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
                'degats' => 'd6x3',
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
                'degats' => 'd6M',
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
                'degats' => 'd6x2',
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
                'degats' => 'd6B',
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
                'degats' => 'd6B',
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
                'degats' => 'd6',
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
                'degats' => 'd6M',
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
                'degats' => 'd6',
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
                'degats' => 'd6',
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
                'degats' => 'd6M',
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
                'degats' => 'spécial',
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
                'degats' => 'd6B',
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
                'degats' => 'd6x2',
                'protection' => 'd6-2 (2)',
                'id_taille' => '6',  // Énorme
            ],
            [
                'id' => '48',
                'nom' => 'Main cavaleuse',
                'vigueur' => '0',
                'agilite' => '3',
                'esprit' => '-2',
                'vitalite' => '3',
                'attaque' => '3',
                'defense' => '4',
                'degats' => 'd3',
                'protection' => '0',
                'id_taille' => '2',
            ],
            [
                'id' => '49',
                'nom' => 'Nécropède',
                'vigueur' => '6',
                'agilite' => '0',
                'esprit' => '0',
                'vitalite' => '30',
                'attaque' => '4',
                'defense' => '0',
                'degats' => 'd6B',
                'protection' => '0',
                'id_taille' => '5',
            ],
            [
                'id' => '50',
                'nom' => 'Nécrophage',
                'vigueur' => '2',
                'agilite' => '2',
                'esprit' => '0',
                'vitalite' => '10',
                'attaque' => '3',
                'defense' => '2',
                'degats' => 'd6',
                'protection' => '0',
                'id_taille' => '4',
            ],

            // ── Bestiaire du Beshaar (La Perle du Beshaar, p. 24-35) ──
            // La slorth couronnée (Mélèshu, p. 35) est une rivale à carrières : elle relève des PNJ, pas du bestiaire.
            [
                'id' => '51',
                'nom' => 'Chien de Zaggath',
                'vigueur' => '2',
                'agilite' => '1',
                'esprit' => '1',
                'vitalite' => '12',
                'attaque' => '2',
                'defense' => '1',
                'degats' => 'd6',
                'protection' => 'd6-3 (1)',
                'id_taille' => '4',  // Moyenne
                'commentaire' => "La Perle du Beshaar, p. 24. Déserts.\nSuint protecteur : ne subit qu'un quart des dégâts de feu (arrondi à l'inférieur) et jamais de malus dû à une forte chaleur. Son suint donne l'« onguent de chien », qui confère cette capacité.",
            ],
            [
                'id' => '52',
                'nom' => 'Dyrhunga',
                'vigueur' => '7',
                'agilite' => '2',
                'esprit' => '0',
                'vitalite' => '40',
                'attaque' => '4',
                'defense' => '2',
                'degats' => 'd6B',
                'protection' => '0',
                'id_taille' => '7',  // Enorme
                'commentaire' => 'La Perle du Beshaar, p. 25. Déserts, montagnes, plaines.',
            ],
            [
                'id' => '53',
                'nom' => 'Dragon de feu',
                'vigueur' => '4',
                'agilite' => '1',
                'esprit' => '-2',
                'vitalite' => '20',
                'attaque' => '2',
                'defense' => '1',
                'degats' => 'd6',
                'protection' => 'd6-2 (2)',
                'id_taille' => '5',  // Grande
                'commentaire' => "La Perle du Beshaar, p. 26. Zones volcaniques.\nCréature du volcan : la chaleur qu'il irradie impose -1 en mêlée à ses adversaires.",
            ],
            [
                'id' => '54',
                'nom' => "Essaim de fourmis d'os",
                'vigueur' => '0',
                'agilite' => '0',
                'esprit' => '0',
                'vitalite' => '30',
                'attaque' => '0',
                'defense' => '0',
                'degats' => '1',
                'protection' => '0',
                'id_taille' => '6',  // Très grande
                'commentaire' => "La Perle du Beshaar, p. 26. Désert et contreforts des Besharoon, lors des essaimages ou au cœur d'une tempête de sable.\nLe livre ne donne pas de profil : vitalité = les 30 points de dégâts qui dispersent la nuée, taille « Très grande » retenue pour cette vitalité.",
            ],
            [
                'id' => '55',
                'nom' => 'Hyène du Beshaar',
                'vigueur' => '0',
                'agilite' => '1',
                'esprit' => '-1',
                'vitalite' => '5',
                'attaque' => '0',
                'defense' => '1',
                'degats' => 'd6M',
                'protection' => '0',
                'id_taille' => '3',  // Petite
                'commentaire' => "La Perle du Beshaar, p. 27. Déserts, plaines, montagnes. Chasse la nuit, par encerclement et harcèlement.\nMeute : sans être de la piétaille, utilise la règle de horde (+1 à l'attaque par hyène engagée dans la mêlée).",
            ],
            [
                'id' => '56',
                'nom' => 'Meneuse de meute (hyène du Beshaar)',
                'vigueur' => '1',
                'agilite' => '2',
                'esprit' => '-1',
                'vitalite' => '10',
                'attaque' => '2',
                'defense' => '1',
                'degats' => 'd6',
                'protection' => '0',
                'id_taille' => '4',  // Moyenne
                'commentaire' => 'La Perle du Beshaar, p. 27. Femelle robuste qui mène une meute de hyènes du Beshaar.',
            ],
            [
                'id' => '57',
                'nom' => 'Hyène géante',
                'vigueur' => '6',
                'agilite' => '1',
                'esprit' => '-1',
                'vitalite' => '30',
                'attaque' => '4',
                'defense' => '1',
                'degats' => 'd6x2',
                'protection' => 'd6-3 (1)',
                'id_taille' => '6',  // Très grande
                'commentaire' => 'La Perle du Beshaar, p. 27. Déserts, montagnes. Chasseuse solitaire, parfois en couple ou en petite meute familiale.',
            ],
            [
                'id' => '58',
                'nom' => "Qal'efr (pieuvre des sables)",
                'vigueur' => '10',
                'agilite' => '2',
                'esprit' => '0',
                'vitalite' => '50',
                'attaque' => '3',
                'defense' => '1',
                'degats' => 'd6M+1',  // les tentacules ; la morsure (d6Bx2) est dans le commentaire et les capacités
                'protection' => '0',
                'id_taille' => '8',  // Massive
                'commentaire' => "La Perle du Beshaar, p. 28. Dunes du désert profond, près des gisements de sable safran.\nAgilité 2 : tentacules uniquement. Dégâts : tentacule d6M+1 (déjà compté le +1 des tentacules corrosifs), morsure d6Bx2.",
            ],
            [
                'id' => '59',
                'nom' => 'Spicomallos',
                'vigueur' => '7',
                'agilite' => '-3',
                'esprit' => '-2',
                'vitalite' => '40',
                'attaque' => '1',
                'defense' => '0',
                'degats' => 'd6x2',
                'protection' => 'd6 (4)',
                'id_taille' => '7',  // Enorme
                'commentaire' => "La Perle du Beshaar, p. 29. Montagnes, plaines. Placide tant qu'on ne l'attaque pas.\nCuirasse hérissée de pointes : ses adversaires subissent -1 à leurs jets d'attaque.",
            ],
            [
                'id' => '60',
                'nom' => 'Ver des sables',
                'vigueur' => '9',
                'agilite' => '1',
                'esprit' => '-1',
                'vitalite' => '50',
                'attaque' => '4',
                'defense' => '1',
                'degats' => 'd6x2',
                'protection' => 'd6-2 (2)',
                'id_taille' => '8',  // Massive
                'commentaire' => 'La Perle du Beshaar, p. 30. Déserts.',
            ],
            [
                'id' => '61',
                'nom' => 'Gardien de bronze',
                'vigueur' => '6',
                'agilite' => '1',
                'esprit' => '0',
                'vitalite' => '20',
                'attaque' => '4',
                'defense' => '0',
                'degats' => 'd6B',
                'protection' => 'd6 (4)',
                'id_taille' => '5',  // Grande
                'commentaire' => "La Perle du Beshaar, p. 31. Ruines des cités des Rois-Sorciers. Esprit : aucun (0 ici).\nMonstre de métal : insensible au feu, au froid, aux poisons, aux maladies et aux sortilèges visant l'esprit.\nPoint faible : le cou (Coup précis) ; décapité, il combat encore mais ne peut plus sonner.",
            ],
            [
                'id' => '62',
                'nom' => "Momie noire d'humain",
                'vigueur' => '2',
                'agilite' => '0',
                'esprit' => '-2',
                'vitalite' => '8',
                'attaque' => '2',
                'defense' => '0',
                'degats' => 'd6M+2',
                'protection' => 'd6-3 (1)',
                'id_taille' => '4',  // Moyenne
                'commentaire' => "La Perle du Beshaar, p. 32-33. Marges occidentales du Beshaar (sable noir). Dégâts et protection : ou selon arme et armure.\nVulnérable au feu (dégâts doublés) et à l'eau (plongée ou aspergée : dé de malus à tous ses jets, « meurt » en 3 rounds).\nAutre créature : celle d'origine avec Vigueur +2, Esprit -2, Vitalité +2, Défense 0, Protection d6-3 (1) au moins, dégâts d'une taille au-dessus.",
            ],
            [
                'id' => '63',
                'nom' => 'Momie noire de coursier des sables',
                'vigueur' => '5',
                'agilite' => '2',
                'esprit' => '-2',
                'vitalite' => '14',
                'attaque' => '1',
                'defense' => '0',
                'degats' => 'd6B',
                'protection' => 'd6-3 (1)',
                'id_taille' => '5',  // Grande
                'commentaire' => "La Perle du Beshaar, p. 33. Marges occidentales du Beshaar (sable noir).\nVulnérable au feu (dégâts doublés) et à l'eau (plongée ou aspergée : dé de malus à tous ses jets, « meurt » en 3 rounds).",
            ],

            // ── Bestiaire du Khanat (Chroniques Lémuriennes 1.2, p. 20-26) ──
            [
                'id' => '64',
                'nom' => 'Arctodus',
                'vigueur' => '9',
                'agilite' => '1',
                'esprit' => '0',
                'vitalite' => '40',
                'attaque' => '3',
                'defense' => '1',
                'degats' => 'd6x2',
                'protection' => 'd6-2 (2)',
                'id_taille' => '7',  // Enorme
                'commentaire' => "Chroniques Lémuriennes, p. 20. Steppes, toundras, montagnes, taïgas, glaciers.\nOurs géant à face courte, d'intelligence semi-humaine : se tient debout (près de 4 m), manipule des objets. Certains vivent en petites tribus, avec un langage et un outillage rudimentaires.",
            ],
            [
                'id' => '65',
                'nom' => 'Bubalus des neiges',
                'vigueur' => '5',
                'agilite' => '-2',
                'esprit' => '-2',
                'vitalite' => '20',
                'attaque' => '0',
                'defense' => '0',
                'degats' => 'd6B',
                'protection' => 'd6-2 (2)',
                'id_taille' => '5',  // Grande
                'commentaire' => "Chroniques Lémuriennes, p. 20. Toundras, montagnes.\nFaire front : Attaque +1 et Défense +1 quand le troupeau se serre en ligne ou en cercle.",
            ],
            [
                'id' => '66',
                'nom' => 'Eucladocéros',
                'vigueur' => '6',
                'agilite' => '1',
                'esprit' => '-1',
                'vitalite' => '30',
                'attaque' => '2',
                'defense' => '0',
                'degats' => 'd6B',
                'protection' => 'd6-3 (1)',
                'id_taille' => '6',  // Très grande
                'commentaire' => "Chroniques Lémuriennes, p. 21. Taïgas, montagnes, toundras. Le « Gardien » (maïkalha) des Wei.\nEsprit de -1 à 3 selon l'individu (-1 ici).\nMagie : certains ont quelques rangs de prêtre ou de sorcier, avec des points de foi ou de pouvoir.\nRégénération (mineure) : regagne 1 point de vitalité par minute ; fuit s'il se sent battu, pour revenir à la charge plus tard.",
            ],
            [
                'id' => '67',
                'nom' => 'Morska',
                'vigueur' => '14',
                'agilite' => '0',
                'esprit' => '-1',
                'vitalite' => '70',
                'attaque' => '1',
                'defense' => '0',
                'degats' => 'd6x3',
                'protection' => 'd6-1 (3)',
                'id_taille' => '10',  // Gigantesque
                'commentaire' => "Chroniques Lémuriennes, p. 22. Mers froides, banquise. Morse gigantesque (15 à 20 m).\nProfil dans l'eau. Sur la terre ferme : Agilité -2 et Attaque +0.",
            ],
            [
                'id' => '68',
                'nom' => 'Tigre bleu',
                'vigueur' => '5',
                'agilite' => '2',
                'esprit' => '0',
                'vitalite' => '25',
                'attaque' => '3',
                'defense' => '2',
                'degats' => 'd6B',
                'protection' => 'd6-2 (2)',
                'id_taille' => '5',  // Grande
                'commentaire' => 'Chroniques Lémuriennes, p. 22. Taïgas, toundras. Grand félin aux yeux de saphir et à l\'odeur enivrante.',
            ],
            [
                'id' => '69',
                'nom' => 'Xalibu',
                'vigueur' => '4',
                'agilite' => '1',
                'esprit' => '-2',
                'vitalite' => '15',
                'attaque' => '0',
                'defense' => '0',
                'degats' => 'd6B',
                'protection' => 'd6-2 (2)',
                'id_taille' => '5',  // Grande
                'commentaire' => 'Chroniques Lémuriennes, p. 23. Toundras. Gros renne sauvage, domestiqué par certaines tribus wei.',
            ],
            [
                'id' => '70',
                'nom' => 'Yi qi',
                'vigueur' => '-1',
                'agilite' => '4',
                'esprit' => '-2',
                'vitalite' => '5',
                'attaque' => '2',
                'defense' => '4',
                'degats' => 'd6M',
                'protection' => '0',
                'id_taille' => '3',  // Petite
                'commentaire' => "Chroniques Lémuriennes, p. 23. Steppes, taïgas, montagnes. Rapace aux ailes membraneuses, dressé pour la fauconnerie et le combat.\nLe yi qi flamboyant, aux longues plumes rouge et or, est une sous-espèce très rare.",
            ],
            [
                'id' => '71',
                'nom' => 'Gardien du Royaume Putride',
                'vigueur' => '1',
                'agilite' => '0',
                'esprit' => '1',
                'vitalite' => '15',
                'attaque' => '2',
                'defense' => '2',
                'degats' => 'd6B+1',
                'protection' => 'd6 (4)',
                'id_taille' => '4',  // Moyenne
                'commentaire' => "Chroniques Lémuriennes, p. 24. Forêts froides, toundras. Guerrier mort-vivant momifié par le froid, à la tête d'une troupe de squelettes.\nAgilité et Défense avec l'armure (sans : Agilité 2, Défense 1). Armure lourde, casque, petit bouclier (+1 en défense contre une attaque par round). Dégâts : arme moyenne, dé de bonus de l'aura de givre compris.\nCapitaine des morts : avec des squelettes piétaille (BoL p. 128), sacrifie d6B points de force vitale pour relever deux fois ce nombre de ces morts-vivants, qui agissent dès le round suivant.",
            ],
            [
                'id' => '72',
                'nom' => 'Leng shi',
                'vigueur' => '0',
                'agilite' => '2',
                'esprit' => '2',
                'vitalite' => '10',
                'attaque' => '0',
                'defense' => '0',
                'degats' => 'd3',
                'protection' => '0',
                'id_taille' => '4',  // Moyenne
                'commentaire' => "Chroniques Lémuriennes, p. 25. Tous milieux. Fantôme d'une créature morte de froid, attaché au lieu de sa dépouille. Taille : moyenne, ou celle de la créature d'origine.\nN'attaque pas : dégâts d3 = son hurlement (cf. capacité). Apaisé par des funérailles convenables ou en obtenant justice.\nIntangible : traverse les objets solides ; seules la sorcellerie et l'alchimie le blessent. À 0, il est détruit.\nPossession : près de sa dépouille, jet d'esprit Moyen (0) ou la victime devient sa marionnette. Libérée si elle tombe à 0 ou est assommée (puis esprit Très facile +2).",
            ],
            [
                'id' => '73',
                'nom' => 'Mogmaï',
                'vigueur' => '0',
                'agilite' => '0',
                'esprit' => '0',
                'vitalite' => '1',
                'attaque' => '3',
                'defense' => '0',
                'degats' => 'd3',
                'protection' => '0',
                'id_taille' => '4',  // Moyenne
                'commentaire' => "Chroniques Lémuriennes, p. 26. Lieux d'habitation, lieux clos. Revenant né du meurtre rituel d'un enfant, lié à un lieu et au sorcier qui l'a créé (la mèche de cheveux de l'enfant protège de ses attaques et lui donne des ordres).\nLe livre ne donne pas de profil (taille : aucune) : attaque et dégâts de la volée de petits objets, vitalité 1 = le phylactère, taille « Moyenne » retenue pour en faire un coriace.\nEsprit frappeur : sans forme matérielle, il ne peut être combattu.\nPhylactère : son âme est enfermée dans un objet (souvent un jouet) déposé dans le lieu ; le briser détruit le mogmaï.",
            ],
            [
                'id' => '74',
                'nom' => 'Windoku',
                'vigueur' => '6',
                'agilite' => '1',
                'esprit' => '3',
                'vitalite' => '36',
                'attaque' => '3',
                'defense' => '0',
                'degats' => 'd6B',
                'protection' => 'd6-3 (1)',
                'id_taille' => '5',  // Grande
                'commentaire' => "Chroniques Lémuriennes, p. 26. Forêts froides, toundras. Revenant né de l'âme maudite d'un cannibale ; nécrophage émacié ou géant mêlant arctodus et xalibu. Ennemi de l'eucladocéros.",
            ],
        ];

        // Ids stables : un re-seed met à jour sans supprimer, pour ne pas casser (ON DELETE SET NULL)
        // les liens des scénarios et des combats. Seules les créatures système retirées de la liste sont supprimées.
        BolCreature::whereNull('user_id')->whereNotIn('id', array_column($creatures, 'id'))->delete();
        foreach ($creatures as $creature) {
            BolCreature::updateOrCreate(['id' => $creature['id']], $creature);
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

            // Bestiaire du Beshaar. Ids à partir de 1001 : les capacités des créatures d'utilisateur ont déjà pris
            // les ids suivants (auto-incrément), qu'un updateOrCreate sur 32, 33… écraserait.
            [
                'id' => '1001',
                'creature_id' => '52',
                'capacite_id' => '5',
                'detail' => 'Dans une tempête de sable ou un orage.'
            ],
            [
                'id' => '1002',
                'creature_id' => '52',
                'capacite_id' => '3',
                'detail' => 'Chasseur dans la tempête : au cœur d\'une tempête, ses proies subissent un dé de malus au jet de réaction et sa première attaque a un dé de bonus. Il ne subit aucun malus dû aux éléments.'
            ],
            [
                'id' => '1003',
                'creature_id' => '54',
                'capacite_id' => '3',
                'detail' => 'Essaim dévorant : chaque round, qui est pris dans la nuée perd 1 point de vitalité (armure sans effet) et subit un dé de malus à toutes ses actions. Frapper l\'essaim touche automatiquement et inflige d3 + vigueur/2 (arrondi à l\'inférieur), quelle que soit l\'arme. Dispersé après 30 points de dégâts.'
            ],
            [
                'id' => '1004',
                'creature_id' => '58',
                'capacite_id' => '2',
                'detail' => '3 attaques de tentacule par round au plus (5 points de vitalité par tentacule). Si deux tentacules touchent la même proie, elle est attirée vers la gueule au round suivant : morsure d6Bx2 chaque round, jusqu\'à trancher les tentacules ou réussir un jet de vigueur très difficile (-4).'
            ],
            [
                'id' => '1005',
                'creature_id' => '58',
                'capacite_id' => '3',
                'detail' => 'Piège de sable : sur la zone du piège, jet d\'agilité difficile (-2) ou chute dans l\'entonnoir. Pour s\'en extirper : agilité très difficile (-4) au 2e round, impossible (-6) au 3e ; un échec au 3e expose à la morsure. Sinon, il faut une aide extérieure (corde…) ou tuer le monstre.'
            ],
            [
                'id' => '1006',
                'creature_id' => '58',
                'capacite_id' => '4',
                'detail' => 'Tentacules corrosifs : +1 aux dégâts de chaque tentacule, puis 1 point de dégâts par round tant que la victime reste prisonnière.'
            ],
            [
                'id' => '1007',
                'creature_id' => '59',
                'capacite_id' => '2',
                'detail' => 'Deux attaques par round (tête, épaule ou queue).'
            ],
            [
                'id' => '1008',
                'creature_id' => '60',
                'capacite_id' => '3',
                'detail' => 'Attaque-surprise : quand il jaillit du sable, ses proies subissent un dé de malus au jet de réaction.'
            ],
            [
                'id' => '1009',
                'creature_id' => '60',
                'capacite_id' => '5',
                'detail' => 'Dans les sables du désert.'
            ],
            [
                'id' => '1010',
                'creature_id' => '60',
                'capacite_id' => '8',
                'detail' => 'Presque aveugle, il traque ses proies aux vibrations du sol.'
            ],
            [
                'id' => '1011',
                'creature_id' => '61',
                'capacite_id' => '3',
                'detail' => 'Attaque sonore : toute créature vivante à 20 m fait un jet de vigueur ardu (-1), sinon -1 à tous ses jets et -1 en défense pendant 2 rounds. Sonner occupe son action du round ; chaque sonnerie réveille et attire les gardiens de bronze à 500 m.'
            ],
            [
                'id' => '1012',
                'creature_id' => '62',
                'capacite_id' => '3',
                'detail' => 'Spores noires : au corps à corps, jet de vigueur ardu (-1) ou -1 aux attaques (nausées). Blessé par elle : vigueur difficile (-2) ou nécrose, 1 point de dégâts par heure jusqu\'à la mort. Soins : panacée, eau au sable safran, ou cautérisation (Soins difficile -2 : 1 dégât si réussi, d6M sinon). La victime se relève en momie noire en d3 heures.'
            ],
            [
                'id' => '1013',
                'creature_id' => '63',
                'capacite_id' => '3',
                'detail' => 'Spores noires : au corps à corps, jet de vigueur ardu (-1) ou -1 aux attaques (nausées). Blessé par elle : vigueur difficile (-2) ou nécrose, 1 point de dégâts par heure jusqu\'à la mort. Soins : panacée, eau au sable safran, ou cautérisation (Soins difficile -2 : 1 dégât si réussi, d6M sinon). La victime se relève en momie noire en d3 heures.'
            ],

            // Bestiaire du Khanat. Ids à partir de 2001 : l'auto-incrément a déjà dépassé 1013 (capacités
            // de créatures d'utilisateur créées depuis), qu'un updateOrCreate sur 1014, 1015… écraserait.
            ['id' => '2001', 'creature_id' => '64', 'capacite_id' => '1', 'detail' => null],
            [
                'id' => '2002',
                'creature_id' => '65',
                'capacite_id' => '3',
                'detail' => 'Faire front : les bubalus se serrent en ligne ou en cercle de défense compact et gagnent +1 en défense et +1 à leurs jets d\'attaque.'
            ],
            ['id' => '2003', 'creature_id' => '66', 'capacite_id' => '5', 'detail' => 'Discret malgré sa taille quand il ne veut pas être vu.'],
            [
                'id' => '2004',
                'creature_id' => '68',
                'capacite_id' => '3',
                'detail' => 'Envoûtement : qui croise son regard fait un jet d\'esprit Moyen (0), Difficile (-2) au cœur de son territoire. En cas d\'échec, fasciné, il avance vers le tigre sans se défendre (-4 en défense) jusqu\'à ce que le tigre attaque.'
            ],
            ['id' => '2005', 'creature_id' => '68', 'capacite_id' => '5', 'detail' => 'Se fond dans son environnement naturel.'],
            ['id' => '2006', 'creature_id' => '68', 'capacite_id' => '6', 'detail' => null],
            ['id' => '2007', 'creature_id' => '69', 'capacite_id' => '7', 'detail' => null],
            ['id' => '2008', 'creature_id' => '70', 'capacite_id' => '1', 'detail' => null],
            [
                'id' => '2009',
                'creature_id' => '71',
                'capacite_id' => '3',
                'detail' => 'Aura de givre : un froid mortel émane de lui ; ses attaques ont un dé de bonus aux dégâts (déjà compté dans son profil).'
            ],
            [
                'id' => '2010',
                'creature_id' => '72',
                'capacite_id' => '3',
                'detail' => 'Gémissement : au premier round, qui l\'entend fait un jet d\'esprit Moyen (0), sinon terreur (-2 à ses jets d\'action ; fuite s\'il est poltron ou se méfie de la sorcellerie), nouveau jet chaque round. Hurlement : chaque round, d3 dégâts sans protection à tous ceux à 10 m.'
            ],
            [
                'id' => '2011',
                'creature_id' => '73',
                'capacite_id' => '2',
                'detail' => 'Une attaque par round, au choix : volée de petits objets contre tous les héros de la pièce (Attaque +3, dégâts d3, jets individuels) ou gros objet, meuble, contre un seul héros (Attaque +2, dégâts d6M).'
            ],
            ['id' => '2012', 'creature_id' => '74', 'capacite_id' => '1', 'detail' => null],
            ['id' => '2013', 'creature_id' => '74', 'capacite_id' => '5', 'detail' => 'Se cache aux yeux de ses futures victimes.'],
            [
                'id' => '2014',
                'creature_id' => '74',
                'capacite_id' => '3',
                'detail' => 'Cannibalisme : qui entre dans la région qu\'il hante fait chaque jour un jet d\'esprit, de Facile le premier jour à Très difficile dès le cinquième. En cas d\'échec, une envie de chair de ses semblables naît, puis devient insatiable.'
            ],
        ];
        // `id` n'est pas fillable : sans unguarded, la création l'ignorerait (auto-incrément) et chaque re-seed dupliquerait.
        BolCreatureCapacite::unguarded(function () use ($capacites) {
            foreach ($capacites as $capacite) {
                BolCreatureCapacite::updateOrCreate(['id' => $capacite['id']], $capacite);
            }
        });
    }
}
