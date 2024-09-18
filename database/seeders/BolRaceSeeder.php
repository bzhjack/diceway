<?php

namespace Database\Seeders;

use App\Models\Bol\BolRace;
use Illuminate\Database\Seeder;

class BolRaceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $races = [
            ["id" => 1, "race" => "Céruléens", "description" => "Les géants à la peau grise, aussi appelés nomades bleus, mesurent entre 2,20 et 2,70 m et sont généralement chauves."],
            ["id" => 2, "race" => "Grooth", "description" => "Les Grooth sont des hommes primitifs anthropophages, trapus avec de longs bras, un visage simiesque, des yeux rouges et des crocs proéminents."],
            ["id" => 3, "race" => "Hommes-oiseaux", "description" => "Les hommes-oiseaux des montagnes de l'Axos sont agiles, vivent dans des grottes, planent sur de courtes distances et utilisent des armes légères. Leurs serres leur permettent de grimper facilement, et ils portent rarement des armures."],
            ["id" => 4, "race" => "Kalukans", "description" => "Les Kalukans sont des eunuques sans tête avec un œil au centre de la poitrine, dotés d'une force surhumaine. Créés par alchimie, ils n'ont ni besoin de manger ni de dormir, et sont maintenus en vie par des tatouages magiques."],
            ["id" => 5, "race" => "Morgal", "description" => "Les Morgal sont des vampires immortels, initialement semblables à des humains, mais devenant de plus en plus fous avec le temps. Leurs yeux varient du rouge au noir, et leurs ongles poussent rapidement."],
            ["id" => 6, "race" => "Rois-Sorciers", "description" => "Les Rois-Sorciers dominaient la Lémurie avant l'arrivée de l'homme. Ils étaient très forts, intelligents et créatifs, maîtrisant une puissante sorcellerie issue d'Hadron et des seigneurs du Néant."],
            ["id" => 7, "race" => "Slorth", "description" => "Les Slorth, créatures des Rois-Sorciers, sont des serpents à tête de femme vivant dans les déserts de Beshaar et les plaines de Klaar. Leur morsure venimeuse plonge la victime dans un profond sommeil."],

        ];
        BolRace::truncate();
        // Insérer les données dans la table des régions
        foreach ($races as $race) {
            BolRace::create($race);
        }
    }
}

