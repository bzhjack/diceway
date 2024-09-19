<?php

namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Bol\BolDemon;

class BolDemonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $demons = [
            [
                'id' => '1',
                'nom' => 'Zullthegg',

                'vigueur' => '1',
                'agilite' => '2',
                'esprit' => '-1',
                'aura' => '0',

                'vitalite' => '11',

                'melee' => '0',
                'tir' => '2',
                'defense' => '0',

                'degats' => 'd6M',
                'id_categorie' => 1,  // Mineur
            ],

        ];

        BolDemon::whereNull('user_id')->delete();
        // Insérer les données dans la table des régions
        foreach ($demons as $demon) {
            BolDemon::create($demon);
        }
    }
}
