<?php

namespace Database\Seeders;

use App\Models\Bol\BolTaille;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class BolTailleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tailles = [
            ['id' => 1, 'taille' => 'Minuscule', 'type' => 'P'],
            ['id' => 2, 'taille' => 'Très petite', 'type' => 'P'],
            ['id' => 3, 'taille' => 'Petite', 'type' => 'C'],
            ['id' => 4, 'taille' => 'Moyenne', 'type' => 'C'],
            ['id' => 5, 'taille' => 'Grande', 'type' => 'R'],
            ['id' => 6, 'taille' => 'Très grande', 'type' => 'R'],
            ['id' => 7, 'taille' => 'Enorme', 'type' => 'R'],
            ['id' => 8, 'taille' => 'Massive', 'type' => 'R'],
            ['id' => 9, 'taille' => 'Colossale', 'type' => 'R'],
            ['id' => 10, 'taille' => 'Gigantesque', 'type' => 'R'],
            ['id' => 11, 'taille' => 'Immense', 'type' => 'R'],
            ['id' => 12, 'taille' => 'Monstrueuse', 'type' => 'R'],
            // Ajoutez d'autres régions selon vos besoins
        ];
        Schema::disableForeignKeyConstraints();
        BolTaille::truncate();
        Schema::enableForeignKeyConstraints();
        // Insérer les données dans la table des régions
        foreach ($tailles as $taille) {
            BolTaille::create($taille);
        }
    }
}
