<?php

namespace Database\Seeders;
use App\Models\Bol\BolDemonPouvoir;
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

                'pouvoirs' => [
                    ['pouvoir_id' => '1'],
                ],
            ],
            [
                'id' => '2',
                'nom' => 'Vul’mazzanlu, la chose singe',

                'vigueur' => '3',
                'agilite' => '3',
                'esprit' => '2',
                'aura' => '-2',

                'vitalite' => '23',

                'melee' => '3',
                'tir' => '1',
                'defense' => '2',

                'degats' => 'd6B',
                'id_categorie' => 2,

                'pouvoirs' => [
                    ['pouvoir_id' => '3'],
                    ['pouvoir_id' => '9'],
                ],
            ],
            [
                'id' => '3',
                'nom' => 'Mazallakos le Voilé',

                'vigueur' => '2',
                'agilite' => '4',
                'esprit' => '5',
                'aura' => '1',

                'vitalite' => '32',

                'melee' => '4',
                'tir' => '0',
                'defense' => '4',

                'degats' => 'd6B',
                'id_categorie' => 3,

                'pouvoirs' => [
                    ['pouvoir_id' => '7'],
                    ['pouvoir_id' => '8'],
                    ['pouvoir_id' => '12', 'detail' => 'érudit 6'],
                    ['pouvoir_id' => '15'],
                ],
            ],

        ];

        BolDemon::whereNull('user_id')->delete();
        // Insérer les données dans la table des régions
        foreach ($demons as $demon) {
            $pouvoirs = $demon['pouvoirs'] ?? [];
            unset($demon['pouvoirs']);
            $newDemon = BolDemon::create($demon);
            foreach ($pouvoirs as $pouvoir) {
                $pouvoir['demon_id'] = $newDemon->id;
                BolDemonPouvoir::create($pouvoir);
            }
        }
    }
}
