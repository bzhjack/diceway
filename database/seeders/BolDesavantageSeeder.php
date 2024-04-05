<?php

namespace Database\Seeders;

use App\Models\BolDesavantage;
use Illuminate\Database\Seeder;

class BolDesavantageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $desavantages = [
            [
                'id' => 1,
                'desavantage' => 'Addiction',
                'de_malus' => true,
                'de_malus_domaine' => 'Si vous passez une journée sans assouvir votre vice, s\'applique à toutes les actions',
            ],
            [
                'id' => 2,
                'desavantage' => 'Âgé',
                'de_malus' => true,
                'de_malus_domaine' => 'Repos obligatoire, action physique'
            ],
            [
                'id' => 3,
                'desavantage' => 'Arrogant',
                'de_malus' => true,
                'de_malus_domaine' => 'Intéraction avec des provinciaux ou des étrangers.',
            ],
            [
                'id' => 4,
                'desavantage' => 'Bigleux',
                'de_malus' => true,
                'de_malus_domaine' => 'Pour observer ou repérer quelque chose.',
            ],
            [
                'id' => 5,
                'desavantage' => 'Borgne/oreille coupée',
                'de_malus' => true,
                'de_malus_domaine' => 'Quand le MJ estime que cela est approprié à la situation.',
            ],
            [
                'id' => 6,
                'desavantage' => 'Bouseux',
                'de_malus' => true,
                'de_malus_domaine' => 'Situations concernant la survie en milieu urbain.',
            ],
            [
                'id'=> 7 ,
                'desavantage' => 'Chétif',
                'attribut' => 'vitalite',
                'attribut_malus' => -2,
            ],
            [
                'id' => 8,
                'desavantage' => 'Crédule',
                'de_malus' => true,
                'de_malus_domaine' => 'Quelqu’un essaie de vous convaincre.',
            ],
            [
                'id' => 9,
                'desavantage' => 'Cupide',
                'de_malus' => true,
                'de_malus_domaine' => 'Chaque fois que vous êtes tenté par une offre alléchante.',
            ],
            [
                'id' => 10,
                'desavantage' => 'Deux mains gauches',
                'de_malus' => true,
                'de_malus_domaine' => 'Crocheter une serrure, tirer à l’arc ou à l’arbalète, toutes action de précision.',

            ],
            [
                'id' => 11,
                'desavantage' => 'Distrait',
                'description' => 'le MJ se fera un plaisir d’exploiter de temps à autre.',

            ],
            [
                'id' => 12,
                'desavantage' => 'Dur d’oreille',
                'de_malus' => true,
                'de_malus_domaine' => 'Appel à votre audition pour percevoir quelque chose.',

            ],
            [
                'id' => 13,
                'desavantage' => 'Fanatique',
                'de_malus' => true,
                'de_malus_domaine' => 'Vous montrer courtois envers un infidèle.',

            ],
            [
                'id' => 14,
                'desavantage' => 'Fanfaron',
                'description' => 'Vous avez une très haute opinion de vous-même.',
            ],
            [
                'id' => 15,
                'desavantage' => 'Foie jaune',
                'description' => 'Lancez un d3 : c’est le nombre de rounds où vous restez paralysé par la situation (sauf défense).',
            ],
            [
                'id' => 16,
                'desavantage' => 'Gars de la ville',
                'de_malus' => true,
                'de_malus_domaine' => 'Survie en milieu sauvage.',
            ],
            [
                'id' => 17,
                'desavantage' => 'Illettré',
                'description' => 'Vous ne savez ni lire ni écrire (limite les carrières).',
            ],
            [
                'id' => 18,
                'desavantage' => 'Impétueux',
                'de_malus' => true,
                'de_malus_domaine' => 'Contrôler votre colère et d’agir rationnellement.',
            ],
            [
                'id' => 19,
                'desavantage' => 'Inadapté à la chaleur',
                'de_malus' => true,
                'de_malus_domaine' => 'Actions entreprises dans un environnement de grande chaleur.',
            ],
            [
                'id' => 20,
                'desavantage' => 'Inadapté au froid',
                'de_malus' => true,
                'de_malus_domaine' => 'Actions entreprises dans un environnement de grand froid.',
            ],
            [
                'id' => 21,
                'desavantage' => 'Incapable de mentir',
                'de_malus' => true,
                'de_malus_domaine' => 'Essayez de tromper autrui, de dire des demi-vérités ou de cacher une information.',
            ],
            [
                'id' => 22,
                'desavantage' => 'Indigne de confiance',
                'de_malus' => true,
                'de_malus_domaine' => 'La situation exige que quelqu’un vous croie ou vous fasse confiance.',
            ],
            [
                'id' => 23,
                'desavantage' => 'Inquiétant',
                'de_malus' => true,
                'de_malus_domaine' => 'Interactions sociales ou quand vous tentez d’amadouer des animaux.',
            ],
            [
                'id' => 24,
                'desavantage' => 'Lent à la détente',
                'de_malus' => true,
                'de_malus_domaine' => 'Vos jets de réaction.',
            ],
            [
                'id' => 25,
                'desavantage' => 'Lubrique',
                'de_malus' => true,
                'de_malus_domaine' => 'Ne pas succomber à un joli minois.',
            ],
            [
                'id' => 26,
                'desavantage' => 'Malédiction de Morgazzon',
                'description' => ': vous êtes atteint de démence.',
            ],
            [
                'id' => 27,
                'desavantage' => 'Manchot/unijambiste',
                'de_malus' => true,
                'de_malus_domaine' => 'Quand le MJ estime que cela est approprié à la situation.',
            ],
            [
                'id' => 28,
                'desavantage' => 'Marin d’eau douce',
                'de_malus' => true,
                'de_malus_domaine' => 'Activité entreprise à bord d’un navire.',
            ],
            [
                'id'=> 29 ,
                'desavantage' => 'Maudit',
                'attribut' => 'heroisme',
                'attribut_malus' => -1,
                'description' => 'les dieux se sont détournés de vous. (malchance)'
            ],
            [
                'id' => 30,
                'desavantage' => 'Mauvaise réputation',
                'de_malus' => true,
                'de_malus_domaine' => 'Les interactions sociales.',
            ],
            [
                'id' => 31,
                'desavantage' => 'Méfiance envers la sorcellerie',
                'de_malus' => true,
                'de_malus_domaine' => 'Quand vous êtes confronté à des sorciers et des alchimistes',
            ],
            [
                'id' => 32,
                'desavantage' => 'Muet',
                'de_malus' => true,
                'de_malus_domaine' => 'Interactions sociales où vous avez besoin de vous faire comprendre.',
            ],
            [
                'id'=> 33 ,
                'desavantage' => 'Non-combattant',
                'description' => '2 point dans les aptitudes de combat. 6 points de carrière...etc'
            ],
            [
                'id'=> 34 ,
                'desavantage' => 'Obsession',
                'de_malus' => true,
                'de_malus_domaine' => 'Tous les jets qui impliquent que vous l’ignoriez.',
            ],
            [
                'id'=> 35 ,
                'desavantage' => 'Pataud',
                'de_malus' => true,
                'de_malus_domaine' => 'Chaque fois que l’équilibre entre en jeu.',
            ],
            [
                'id'=> 36 ,
                'desavantage' => 'Phobie',
                'de_malus' => true,
                'de_malus_domaine' => 'En présence de l’objet de votre phobie',
            ],
            [
                'id'=> 37 ,
                'desavantage' => 'Poltron',
                'de_malus' => true,
                'de_malus_domaine' => 'Résister aux effets de la peur ou de l’intimidation.',
            ],
            [
                'id'=> 38 ,
                'desavantage' => 'Repoussant',
                'de_malus' => true,
                'de_malus_domaine' => 'Situations où l’apparence peut avoir son importance.',
            ],
            [
                'id'=> 39 ,
                'desavantage' => 'Signe distinctif',
                'de_malus' => true,
                'de_malus_domaine' => 'Vous essayez de vous déguiser ou de passer inaperçu.',
                'description' => 'Si vous êtes également affligé du désavantage traqué, les chasseurs de primes et les espions ont deux fois plus de chances de vous repérer'
            ],
            [
                'id'=> 40 ,
                'desavantage' => 'Soiffard',
                'description' => 'Quand vous êtes chargé d’une tâche importante par vos compagnons, lancez un D6. Si vous obtenez un 1, vous échoué.'
            ],
            [
                'id'=> 41 ,
                'desavantage' => 'Souffreteux',
                'description' => 'Vous ne pouvez récupérer de points de vitalité perdus que si vous bénéficiez de soins médicaux.'
            ],
            [
                'id'=> 42 ,
                'desavantage' => 'Taciturne',
                'de_malus' => true,
                'de_malus_domaine' => 'Les interactions sociales.'
            ],
            [
                'id'=> 43 ,
                'desavantage' => 'Traqué',
                'description' => 'Vous êtes recherché.Lancez un D6 à chaque fois que vous entrez dans une ville nouvelle. Sur un 1, vous êtes repéré.'
            ],
            // Ajoutez d'autres régions selon vos besoins
            /*
             [
                'id'=>  ,
                'desavantage' => 'Beau parleur',
                'attribut' => null,
                'attribut_malus' => null,
                'de_malus' => false,
                'de_malus_domaine' => null,
                'description' => null
            ],
             */
        ];

        // Insérer les données dans la table des régions
        foreach ($desavantages as $desavantage) {
            BolDesavantage::create($desavantage);
        }
    }
}
