<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\Schema;
use App\Models\Bol\BolLangue;
use Illuminate\Database\Seeder;

class BolLangueSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $langues = [
            ["id" => 1, "langue" => "Argot des mers", "description" => "Argot marin des Îles du Crâne, mélange éclectique d'influences linguistiques, transmis principalement par la parole et l'interaction sociale entre les habitants de l'archipel."],
            ["id" => 2, "langue" => "Axien", "description" => "Langue des tribus barbares vivant dans la chaîne de l’Axos, plutôt confinée à cette région montagneuse. D'anciens textes datant de l’époque où l’axien était plus largement répandu seraient entreposés dans des grottes oubliées au cœur des montagnes."],
            ["id" => 3, "langue" => "Beshaari", "description" => "Langue des nomades du désert de Beshaar, parlée et écrite par ses habitants. La plupart des habitants d’Halakh parlent le beshaari en plus du lémurien."],
            ["id" => 4, "langue" => "Céruléen", "description" => "Langue des nomades bleus, n'ayant pas de forme écrite. Les marchands d’Oomis apprennent souvent le céruléen."],
            ["id" => 5, "langue" => "Démonique", "description" => "Langue antique des Rois-Sorciers. Utilisée pour les puissants sortilèges et recettes alchimiques. Ardu, ses formes orale et écrite exigent un apprentissage séparé. Les magiciens de Zalut conversent en démonique, sauf avec des étrangers."],
            ["id" => 6, "langue" => "Festreli", "description" => "Dialecte originaire du lémurien, devenu presque inintelligible pour les locuteurs du lémurien en raison de son éloignement évolutif."],
            ["id" => 7, "langue" => "Grooth", "description" => "Langage rudimentaire des tribus des grooth, composé de grognements, de grimaces, de tapements du pied et de mouvements simiesques. Aucune forme écrite, inusité en dehors des tribus des grooth."],
            ["id" => 8, "langue" => "Kashtien", "description" => "Langue propre aux habitants des marais de Kasht, chaque tribu utilisant une variante qui lui est propre."],
            ["id" => 9, "langue" => "Lémurien", "description" => "Langue la plus couramment parlée en Lémurie, mais chaque cité a son propre dialecte lémurien. Les voyageurs peuvent avoir du mal à comprendre les gens du coin, nécessitant parfois un jet d'esprit pour communiquer avec ceux d'autres cités.", "est_lemurienne" => true],
            ["id" => 10, "langue" => "Malakutien", "description" => "Langue parlée par les habitants de Malakut et des régions environnantes."],
            ["id" => 11, "langue" => "Shamite", "description" => "Langue parlée par les habitants de Shamballah et des régions environnantes."],
            ["id" => 12, "langue" => "Chant du vent", "description" => "Langue chantante des hommes-oiseaux, évoquant le son de la brise et des bourrasques. Très difficile à parler correctement pour un étranger. Possède une forme écrite tout aussi difficile à maîtriser et à traduire."],
            ["id" => 13, "langue" => "Valgardien", "description" => "Langue parlée et écrite par les habitants du Valgard, étonnamment élaborée."],
            ["id" => 14, "langue" => "Ygddari", "description" => "Ancienne langue des hommes (aussi appelée langue des Anciens). Peu d'individus la parlent aujourd'hui, et encore moins peuvent la lire. Des textes antiques sont parfois retrouvés dans les ruines, nécessitant les services d'un scribe particulièrement compétent pour leur traduction."],
        ];
        Schema::disableForeignKeyConstraints();
        BolLangue::truncate();
        Schema::enableForeignKeyConstraints();
        foreach ($langues as $langue) {
            BolLangue::create($langue);
        }
    }
}
