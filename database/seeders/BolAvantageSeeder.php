<?php

namespace Database\Seeders;

use App\Models\BolAvantage;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
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
                'domaine_de_bonus' => 'Intéraction avec les animaux',
                'description' => 'Dresseur: deux ou trois compagnons animaux de taille petite, ou un seul de taille moyenne ou grande.'
            ],
            [
                'id'=> 3 ,
                'avantage' => 'Ami des céruléens',
                'de_bonus' => true,
                'domaine_de_bonus' => 'Intéraction avec les nomades bleus.',
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
                'domaine_de_bonus' => 'Utilisation de votre arme favorite.',
            ],
            [
                'id'=> 7 ,
                'avantage' => 'Artiste',
                'de_bonus' => true,
                'domaine_de_bonus' => 'Domaine de l\'art',
            ],
            [
                'id'=> 8 ,
                'avantage' => 'Athlète',
                'de_bonus' => true,
                'domaine_de_bonus' => 'activités athlétiques (autres que le combat) comme courir, nager, grimper ou sauter.',
            ],
            [
                'id'=> 9 ,
                'avantage' => 'Attirant',
                'de_bonus' => true,
                'domaine_de_bonus' => 'les situations où l’apparence peut jouer un rôle.',
            ],
            [
                'id'=> 10 ,
                'avantage' => 'Bagarreur',
                'de_bonus' => true,
                'domaine_de_bonus' => 'À l’attaque quand vous combattez à mains nues.',
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
                'domaine_de_bonus' => 'Mentir, escroquer, baratiner ou tromper quelqu’un.'
            ],
            [
                'id'=> 13 ,
                'avantage' => 'Bibliothèque savante',
                'de_bonus' => true,
                'domaine_de_bonus' => 'Recueillir des informations lorsque vous vous trouvez dans votre bibliothèque.'
            ],
            [
                'id'=> 14 ,
                'avantage' => 'Bien né',
                'de_bonus' => true,
                'domaine_de_bonus' => 'Agir selon les règles de l’étiquette et de la courtoisie.'
            ],
            [
                'id'=> 15 ,
                'avantage' => 'Colosse',
                'de_bonus' => true,
                'domaine_de_bonus' => 'Briser, lever, tirer ou pousser des objets.'
            ],
            [
                'id'=> 16 ,
                'avantage' => 'Combat à l’aveugle',
                'description' => 'Pas de malus en combat dans l\'obscurité.'
            ],
            [
                'id'=> 17 ,
                'avantage' => 'Cri de guerre',
                'description' => 'Un dé malus pour les assailants pendant un round. 1 fois par jours ou une dépense de 1 point d’héroïsme'
            ],
            [
                'id'=> 18 ,
                'avantage' => 'Discret',
                'de_bonus' => true,
                'domaine_de_bonus' => 'Faire preuve de discrétion.'
            ],
            [
                'id'=> 19 ,
                'avantage' => 'Doigts de fée',
                'de_bonus' => true,
                'domaine_de_bonus' => 'Le vol à la tire, la fabrication d’objets,le jonglage ou la triche aux cartes et aux dés'
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
                'domaine_de_bonus' => 'Se souvenir d’un fait relevant de votre domaine de compétence'
            ],
            [
                'id'=> 22 ,
                'avantage' => 'Fêtard',
                'de_bonus' => true,
                'domaine_de_bonus' => 'dans les tavernes pour recueillir des informations, des contacts ou des biens et des services. Resister aux effets de la boisson'
            ],
            [
                'id'=> 23 ,
                'avantage' => 'Fils des plaines',
                'de_bonus' => true,
                'domaine_de_bonus' => 'Pister, piéger ou chasser, ainsi que pour d’autres activités similaires de survie'
            ],
            [
                'id'=> 24 ,
                'avantage' => 'Fortuné',
                'de_bonus' => true,
                'domaine_de_bonus' => 'Acquérir des biens ou des services dans votre cité d’origine.'
            ],
            // Ajoutez d'autres régions selon vos besoins
            /*
             [
                'id'=>  ,
                'avantage' => 'Beau parleur',
                'attribut' => null,
                'attribut_bonus' => null,
                'de_bonus' => false,
                'domaine_de_bonus' => null,
                'description' => null
            ],
             */
        ];

        // Insérer les données dans la table des régions
        foreach ($avantages as $avantage) {
            BolAvantage::create($avantage);
        }
    }
}
