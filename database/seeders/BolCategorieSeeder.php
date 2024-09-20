<?php

namespace Database\Seeders;

use App\Models\Bol\BolCategorie;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Seeder;

class BolCategorieSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['id' => 1, 'categorie' => 'Mineur', 'type' => 'P', 'pouvoirs' => '1', 'vitalite' => 10, 'degats' => 'd6M'],
            ['id' => 2, 'categorie' => 'Inférieur', 'type' => 'C', 'pouvoirs' => '2', 'vitalite' => 20, 'degats' => 'd6'],
            ['id' => 3, 'categorie' => 'Majeur', 'type' => 'R', 'pouvoirs' => '4', 'vitalite' => 30, 'degats' => 'd6B'],

        ];
        Schema::disableForeignKeyConstraints();
        BolCategorie::truncate();
        Schema::enableForeignKeyConstraints();
        // Insérer les données dans la table des régions
        foreach ($categories as $categorie) {
            BolCategorie::create($categorie);
        }
    }
}
