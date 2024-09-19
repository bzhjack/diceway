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
            ['id' => 1, 'taille' => 'Minuscule', 'type' => 'P', 'degats' => '1', 'vitalite' => 1, 'vigueur' => -3, 'deplacement' => '4.5m'],
            ['id' => 2, 'taille' => 'Très petite', 'type' => 'P', 'degats' => 'd3', 'vitalite' => 2, 'vigueur' => -2, 'deplacement' => '6m'],
            ['id' => 3, 'taille' => 'Petite', 'type' => 'C', 'degats' => 'd6M', 'vitalite' => 5, 'vigueur' => -1, 'deplacement' => '7.5m'],
            ['id' => 4, 'taille' => 'Moyenne', 'type' => 'C', 'degats' => 'd6', 'vitalite' => 10, 'vigueur' => 0, 'deplacement' => '7.5m'],
            ['id' => 5, 'taille' => 'Grande', 'type' => 'R', 'degats' => 'd6B', 'vitalite' => 20, 'vigueur' => 4, 'deplacement' => '9m'],
            ['id' => 6, 'taille' => 'Très grande', 'type' => 'R', 'degats' => 'd6B', 'vitalite' => 30, 'vigueur' => 6, 'deplacement' => '9m'],
            ['id' => 7, 'taille' => 'Enorme', 'type' => 'R', 'degats' => 'd6x2', 'vitalite' => 40, 'vigueur' => 8, 'deplacement' => '10.5m'],
            ['id' => 8, 'taille' => 'Massive', 'type' => 'R', 'degats' => 'd6Bx2', 'vitalite' => 50, 'vigueur' => 10, 'deplacement' => '10.5m'],
            ['id' => 9, 'taille' => 'Colossale', 'type' => 'R', 'degats' => 'd6Bx2', 'vitalite' => 60, 'vigueur' => 12, 'deplacement' => '12m'],
            ['id' => 10, 'taille' => 'Gigantesque', 'type' => 'R', 'degats' => 'd6x3', 'vitalite' => 70, 'vigueur' => 14, 'deplacement' => '12m'],
            ['id' => 11, 'taille' => 'Immense', 'type' => 'R', 'degats' => 'd6Bx3', 'vitalite' => 85, 'vigueur' => 16, 'deplacement' => '13.5m'],
            ['id' => 12, 'taille' => 'Monstrueuse', 'type' => 'R', 'degats' => 'd6x4', 'vitalite' => 100, 'vigueur' => 18, 'deplacement' => '13.5m'],
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
