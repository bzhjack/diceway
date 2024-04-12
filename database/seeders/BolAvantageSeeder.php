<?php

namespace Database\Seeders;

use App\Models\BolAvantage;
use Illuminate\Database\Seeder;

class BolAvantageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $avantages = [
            [
                'id'=> 1 ,
                'avantage' => 'Agilité de l’homme-oiseau',
                'attribut' => 'agilite',
                'attribut_bonus' => "1"
            ],
            [
                'id'=> 2 ,
                'avantage' => 'Ami des bêtes',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Intéraction avec les animaux',
                'description' => 'Dresseur: deux ou trois compagnons animaux de taille petite, ou un seul de taille moyenne ou grande.'
            ],
            [
                'id'=> 3 ,
                'avantage' => 'Ami des céruléens',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Intéraction avec les nomades bleus.',
            ],
            [
                'id'=> 4 ,
                'avantage' => 'Amis dans la pègre',
                'description' => 'Vous comptez des amis peu recommandables qui peuvent vous aider.'
            ],
            [
                'id'=> 5 ,
                'avantage' => 'Amis haut placés',
                'description' => ' vous jouissez de contacts au sein des plus hauts échelons de la société.'
            ],
            [
                'id'=> 6 ,
                'avantage' => 'Arme favorite',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Utilisation de votre arme favorite.',
            ],
            [
                'id'=> 7 ,
                'avantage' => 'Artiste',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Domaine de l\'art',
            ],
            [
                'id'=> 8 ,
                'avantage' => 'Athlète',
                'de_bonus' => true,
                'de_bonus_domaine' => 'activités athlétiques (autres que le combat) comme courir, nager, grimper ou sauter.',
            ],
            [
                'id'=> 9 ,
                'avantage' => 'Attirant',
                'de_bonus' => true,
                'de_bonus_domaine' => 'les situations où l’apparence peut jouer un rôle.',
            ],
            [
                'id'=> 10 ,
                'avantage' => 'Bagarreur',
                'de_bonus' => true,
                'de_bonus_domaine' => 'À l’attaque quand vous combattez à mains nues.',
            ],
            [
                'id'=> 11 ,
                'avantage' => 'Baudrier de guerre',
                'description' => 'Armure moyenne sans malus.'
            ],
            [
                'id'=> 12 ,
                'avantage' => 'Beau parleur',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Mentir, escroquer, baratiner ou tromper quelqu’un.'
            ],
            [
                'id'=> 13 ,
                'avantage' => 'Bibliothèque savante',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Recueillir des informations lorsque vous vous trouvez dans votre bibliothèque.'
            ],
            [
                'id'=> 14 ,
                'avantage' => 'Bien né',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Agir selon les règles de l’étiquette et de la courtoisie.'
            ],
            [
                'id'=> 15 ,
                'avantage' => 'Colosse',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Briser, lever, tirer ou pousser des objets.'
            ],
            [
                'id'=> 16 ,
                'avantage' => 'Combat à l’aveugle',
                'description' => 'Pas de malus en combat dans l\'obscurité.'
            ],
            [
                'id'=> 17 ,
                'avantage' => 'Cri de guerre',
                'description' => 'Un dé malus pour les assailants pendant le round qui suit. 1 fois par jours ou une dépense de 1 point d’héroïsme'
            ],
            [
                'id'=> 18 ,
                'avantage' => 'Discret',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Faire preuve de discrétion.'
            ],
            [
                'id'=> 19 ,
                'avantage' => 'Doigts de fée',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Le vol à la tire, la fabrication d’objets,le jonglage ou la triche aux cartes et aux dés'
            ],
            [
                'id'=> 20 ,
                'avantage' => 'Dur à cuire',
                'attribut' => 'vitalite',
                'attribut_bonus' => "2"
            ],
            [
                'id'=> 21 ,
                'avantage' => 'Érudit',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Se souvenir d’un fait relevant de votre domaine de compétence'
            ],
            [
                'id'=> 22 ,
                'avantage' => 'Fêtard',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Dans les tavernes pour recueillir des informations, des contacts ou des biens et des services. Resister aux effets de la boisson'
            ],
            [
                'id'=> 23 ,
                'avantage' => 'Fils des plaines',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Pister, piéger ou chasser, ainsi que pour d’autres activités similaires de survie'
            ],
            [
                'id'=> 24 ,
                'avantage' => 'Fortuné',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Acquérir des biens ou des services dans votre cité d’origine.'
            ],
            [
                'id'=> 25 ,
                'avantage' => 'Gamin des rues',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Interagir avec les gens des bas-fonds, filer quelqu\'un ou remarquer un détail dans la rue.'
            ],
            [
                'id'=> 26 ,
                'avantage' => 'Inspirateur',
                'description' => 'Un dé bonus pour les compagnons pendant le round qui suit. 1 fois par jours ou une dépense de 1 point d’héroïsme'
            ],
            [
                'id'=> 27 ,
                'avantage' => 'Intimidant',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Forcer quelqu’un à vous donner une information ou à faire une chose.'
            ],
            [
                'id'=> 28 ,
                'avantage' => 'Intrépide',
                'description' => 'Insensible à la peur, même par la magie'
            ],
            [
                'id'=> 29 ,
                'avantage' => 'Laboratoire fourni',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Créer des préparations alchimiques ou des instruments mécaniques dans le laboratoire.'
            ],
            [
                'id'=> 30 ,
                'avantage' => 'Magie des Rois-Sorciers',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Lancer des sortilèges.',
                'description' => 'vous devez prendre un désavantage supplémentaire.'
            ],
            [
                'id'=> 31 ,
                'avantage' => 'Mains guérisseuses',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Aider un blessé à récupérer de ses blessures, d’un empoisonnement, etc.',
                'description' => 'Vous devez posséder la carrière médecin.'
            ],
            [
                'id'=> 32 ,
                'avantage' => 'Maître du déguisement',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Dissimuler votre identité.',
                'description' => 'vous pouvez dépenser 1 point d’héroïsme pour faire partie du décor.'
            ],
            [
                'id'=> 33 ,
                'avantage' => 'Marqué par les dieux',
                'attribut' => 'heroisme',
                'attribut_bonus' => "1"
            ],
            [
                'id'=> 34 ,
                'avantage' => 'Montagnard',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Pister, piéger ou chasser, ainsi que pour d’autres activités similaires de survie.',
            ],
            [
                'id'=> 35 ,
                'avantage' => 'Né en selle',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Chevaucher des montures et agir en selle.',
            ],
            [
                'id'=> 36 ,
                'avantage' => 'Odorat développé',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Jet d’action sous esprit pour percevoir quelque chose grâce à votre odorat.',
            ],
            [
                'id'=> 37 ,
                'avantage' => 'Ouïe fine',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Jet d’action sous esprit pour percevoir quelque chose grâce à votre ouïe.',
            ],
            [
                'id'=> 38 ,
                'avantage' => 'Outillage',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Entreprendre une action avec vos outils ( en rapport avec votre métier ).',
            ],
            [
                'id'=> 39 ,
                'avantage' => 'Peau dure',
                'attribut' => 'protection',
                'attribut_bonus' => "1"

            ],
            [
                'id'=> 40 ,
                'avantage' => 'Perspicace',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Remarquer une entourloupe ou un mensonge.',
            ],
            [
                'id'=> 41 ,
                'avantage' => 'Pied marin',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Manœuvrer une embarcation ou entreprendre des activités physiques à bord d’un navire.',
            ],
            [
                'id'=> 42 ,
                'avantage' => 'Pisteur des marais',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Pister, piéger ou chasser, ainsi que pour d’autres activités similaires de survie.',
            ],
            [
                'id'=> 43 ,
                'avantage' => 'Poings d’acier',
                'description' => 'Ajoutez votre vigueur aux dégâts quand vous combattez à mains nues.'
            ],
            [
                'id'=> 44 ,
                'avantage' => 'Pouvoir du Néant',
                'attribut' => 'pouvoir',
                'attribut_bonus' => "2",
                'description' => 'Vous devez aussi prendre un désavantage supplémentaire.'
            ],
            [
                'id'=> 45 ,
                'avantage' => 'Récupération rapide',
                'description' => 'Après un combat, vous regagnez 1 point de vitalité supplémentaire, En cas de blessure recupération de 1 point de vitalité par jour.'
            ],
            [
                'id'=> 46 ,
                'avantage' => 'Renard du désert',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Pister, piéger ou chasser, ainsi que pour d’autres activités similaires de survie.',
            ],
            [
                'id'=> 47 ,
                'avantage' => 'Résistant à la magie',
                'description' => 'Lancez un d6. Sur un 6, le sortilège n’a aucun effet sur vous.'
            ],
            [
                'id'=> 48 ,
                'avantage' => 'Résistant aux poisons',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Résister aux effets des drogues, des venins, des toxines, ainsi que de l’alcool.',
            ],
            [
                'id'=> 49 ,
                'avantage' => 'Roi de la jungle',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Pister, piéger ou chasser, ainsi que pour d’autres activités similaires de survie.',
            ],
            [
                'id'=> 50 ,
                'avantage' => 'Roi de l’évasion',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Vous évader ou de vous libérer de vos liens.',
            ],
            [
                'id'=> 51 ,
                'avantage' => 'Santé de fer',
                'description' => 'Vous êtes immunisé à toutes les maladies, y compris celles d’origine magique.'
            ],
            [
                'id'=> 52 ,
                'avantage' => 'Savant',
                'attribut' => 'esprit',
                'attribut_bonus' => "1"
            ],
            [
                'id'=> 53 ,
                'avantage' => 'Sentir la magie',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Reconnaître (ou de traquer) un sorcier, un effet ou un artefact magique.',
            ],
            [
                'id'=> 54 ,
                'avantage' => 'Tigre des neiges',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Pister, piéger ou chasser, ainsi que pour d’autres activités similaires de survie.',
            ],
            [
                'id'=> 55 ,
                'avantage' => 'Tireur puissant',
                'description' => 'vous ajoutez votre vigueur aux dégâts (arc, javelot, fronde)'
            ],
            [
                'id'=> 56 ,
                'avantage' => 'Vigilant',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Jets de réaction.',
            ],
            [
                'id'=> 57 ,
                'avantage' => 'Vigueur céruléenne',
                'attribut' => 'vigueur',
                'attribut_bonus' => "1"
            ],
            [
                'id'=> 58 ,
                'avantage' => 'Vision nocturne',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Quand l’obscurité impose un malus à la vision.',
            ],
            [
                'id'=> 59 ,
                'avantage' => 'Vue perçante',
                'de_bonus' => true,
                'de_bonus_domaine' => 'Jet d’action sous esprit pour percevoir quelque chose grâce à votre vue',
            ],
            // Ajoutez d'autres régions selon vos besoins
            /*
             [
                'id'=>  ,
                'avantage' => 'Beau parleur',
                'attribut' => null,
                'attribut_bonus' => null,
                'de_bonus' => false,
                'de_bonus_domaine' => null,
                'description' => null
            ],
             */
        ];
        // Remise à 0
        BolAvantage::truncate();
        // Insérer les données dans la table des régions
        foreach ($avantages as $avantage) {
            BolAvantage::create($avantage);
        }
    }
}
