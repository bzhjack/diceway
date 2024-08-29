<?php

namespace Database\Seeders;

use App\Models\Bol\BolCapacite;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class BolCapaciteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $capacites = [
            [
                'id' => 1,
                'capacite' => 'Attaque féroce',
                'description' => 'Dé bonus aux jets d’attaque.',
                'de_bonus' => true
            ],
            [
                'id' => 2,
                'capacite' => 'Attaques multiples',
                'description' => 'Deux types d’attaque différents qui nécessitent deux jets d’attaque séparés.'],
            [
                'id' => 3,
                'capacite' => 'Attaque spéciale',
                'description' => 'La créature attaque selon une méthode inhabituelle.'],
            [
                'id' => 4,
                'capacite' => 'Attaque venimeuse',
                'description' => ''],
            [
                'id' => 5,
                'capacite' => 'Camouflage',
                'description' => 'Dé de bonus pour se cacher',
                'de_bonus' => true
             ],
            [
                'id' => 6,
                'capacite' => 'Prédateur',
                'description' => 'Dé de bonus pour le pistage d\'une proie',
                'de_bonus' => true
            ],
            [
                'id' => 7,
                'capacite' => 'Attaque timide',
                'description' => 'Dé malus aux jets d’attaque.',
                'de_malus' => true
            ],
            [
                'id' => 8,
                'capacite' => 'Déficience',
                'description' => 'Dé malus pour l\'odorat, l\'audition ou la vision',
                'de_malus' => true
            ],
            // Ajoutez d'autres régions selon vos besoins
        ];
        Schema::disableForeignKeyConstraints();
        BolCapacite::truncate();
        Schema::enableForeignKeyConstraints();
        // Insérer les données dans la table des régions
        foreach ($capacites as $capacite) {
            BolCapacite::create($capacite);
        }
    }
}
