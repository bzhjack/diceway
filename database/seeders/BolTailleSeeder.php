<?php

namespace Database\Seeders;

use App\Models\Bol\Boltaille;
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
            ['id'=> 1 , 'taille' => 'Minuscule'],
            ['id'=> 2 , 'taille' => 'Très petite'],
            ['id'=> 3 , 'taille' => 'Petite'],
            ['id'=> 4 , 'taille' => 'Moyenne'],
            ['id'=> 5 , 'taille'=> 'Grande'],
            ['id'=> 6 , 'taille'=> 'Très grande'],
            ['id'=> 7 , 'taille'=> 'Enorme'],
            ['id'=> 8 , 'taille'=> 'Massive'],
            ['id'=> 9 , 'taille'=> 'Colossale'],
            ['id'=> 10 , 'taille'=> 'Gigantesque'],
            ['id'=> 11 , 'taille'=> 'Immense'],
            ['id'=> 12 , 'taille'=> 'Monstrueuse'],
            // Ajoutez d'autres régions selon vos besoins
        ];
        Schema::disableForeignKeyConstraints();
        Boltaille::truncate();
        Schema::enableForeignKeyConstraints();
        // Insérer les données dans la table des régions
        foreach ($tailles as $taille) {
            Boltaille::create($taille);
        }
    }
}
