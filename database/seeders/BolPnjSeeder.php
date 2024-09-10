<?php

namespace Database\Seeders;

use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosArme;
use App\Models\Bol\BolHerosArmure;
use App\Models\Bol\BolHerosCarriere;
use App\Models\Bol\BolHerosTrait;
use Illuminate\Database\Seeder;

class BolPnjSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $pnjs = [
            [
                'id' => '1',
                'nom' => 'Archer de Tyrus',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'C',
                'vigueur' => '1',
                'agilite' => '1',
                'esprit' => '0',
                'aura' => '0',
                'initiative' => '0',
                'melee' => '0',
                'tir' => '2',
                'defense' => '0',
                'vitalite' => '7',
                'carrieres' => [
                    ['heros_id' => '1', 'carriere_id' => '23', 'value' => '2']
                ],
                'armures' => [
                    ['heros_id' => '1', 'armure_id' => '2']
                ],
                'armes' => [
                    ['heros_id' => '1', 'arme_id' => '15'],
                    ['heros_id' => '1', 'arme_id' => '18']
                ]
            ],
            [
                'id' => '2',
                'nom' => 'Barbare tribal',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'C',

                'vigueur' => '2',
                'agilite' => '1',
                'esprit' => '0',
                'aura' => '-1',

                'initiative' => '1',
                'melee' => '2',
                'tir' => '-1',
                'defense' => '0',

                'vitalite' => '8',
            ],
            [
                'id' => '3',
                'nom' => 'Assassin halakhi',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'C',

                'vigueur' => '0',
                'agilite' => '1',
                'esprit' => '1',
                'aura' => '0',

                'initiative' => '1',
                'melee' => '0',
                'tir' => '0',
                'defense' => '1',

                'vitalite' => '6',
            ],
            [
                'id' => '4',
                'nom' => 'Champion gladiateur',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'C',

                'vigueur' => '2',
                'agilite' => '1',
                'esprit' => '-1',
                'aura' => '0',

                'initiative' => '1',
                'melee' => '1',
                'tir' => '-1',
                'defense' => '1',

                'vitalite' => '8',
            ],
            [
                'id' => '5',
                'nom' => 'Chef de bande',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'C',

                'vigueur' => '1',
                'agilite' => '1',
                'esprit' => '1',
                'aura' => '-1',

                'initiative' => '1',
                'melee' => '1',
                'tir' => '0',
                'defense' => '0',

                'vitalite' => '7',
            ],
            [
                'id' => '6',
                'nom' => 'Druide jaune d’Oomis',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'C',

                'vigueur' => '0',
                'agilite' => '0',
                'esprit' => '2',
                'aura' => '0',

                'initiative' => '0',
                'melee' => '1',
                'tir' => '0',
                'defense' => '1',

                'vitalite' => '6',
            ],
            [
                'id' => '7',
                'nom' => 'Garde jemadar',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'C',

                'vigueur' => '0',
                'agilite' => '2',
                'esprit' => '-1',
                'aura' => '1',

                'initiative' => '1',
                'melee' => '1',
                'tir' => '-1',
                'defense' => '1',

                'vitalite' => '6',
            ],
            [
                'id' => '8',
                'nom' => 'Guetteur homme-oiseau',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'C',

                'vigueur' => '-1',
                'agilite' => '2',
                'esprit' => '1',
                'aura' => '0',

                'initiative' => '0',
                'melee' => '0',
                'tir' => '1',
                'defense' => '1',

                'vitalite' => '5',
            ],
            [
                'id' => '9',
                'nom' => 'Matelot de Parsool',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'C',

                'vigueur' => '1',
                'agilite' => '1',
                'esprit' => '0',
                'aura' => '0',

                'initiative' => '1',
                'melee' => '1',
                'tir' => '0',
                'defense' => '0',

                'vitalite' => '7',
            ],
            [
                'id' => '10',
                'nom' => 'Pilote de nef volante de Satarla',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'C',

                'vigueur' => '0',
                'agilite' => '0',
                'esprit' => '1',
                'aura' => '1',

                'initiative' => '1',
                'melee' => '0',
                'tir' => '1',
                'defense' => '0',

                'vitalite' => '6',
            ],
            [
                'id' => '11',
                'nom' => 'Sergent du guet',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'C',

                'vigueur' => '2',
                'agilite' => '0',
                'esprit' => '0',
                'aura' => '0',

                'initiative' => '0',
                'melee' => '2',
                'tir' => '0',
                'defense' => '1',

                'vitalite' => '8',
            ],
            [
                'id' => '12',
                'nom' => 'Sentinelle kalukan',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'C',

                'vigueur' => '3',
                'agilite' => '0',
                'esprit' => '0',
                'aura' => '-1',

                'initiative' => '1',
                'melee' => '2',
                'tir' => '-1',
                'defense' => '1',

                'vitalite' => '9',
            ]
        ];

        BolHeros::whereNull('user_id')->delete();
        // Insérer les données dans la table des régions
        foreach ($pnjs as $pnj) {
            $carrieres = $pnj['carrieres'] ?? [];
            $armures = $pnj['armures'] ?? [];
            $armes = $pnj['armes'] ?? [];
            $traits = $pnj['traits'] ?? [];

            unset($pnj['carrieres']);
            unset($pnj['armures']);
            unset($pnj['armes']);
            unset($pnj['traits']);

            $hero = BolHeros::create($pnj);

            foreach ($carrieres as $carriere) {
                $carriere['heros_id'] = $hero->id;
                BolHerosCarriere::create($carriere);
            }
            foreach ($armures as $armure) {
                $armure['heros_id'] = $hero->id;
                BolHerosArmure::create($armure);
            }
            foreach ($armes as $arme) {
                $arme['heros_id'] = $hero->id;
                BolHerosArme::create($arme);
            }
            foreach ($traits as $trait) {
                $trait['heros_id'] = $hero->id;
                BolHerosTrait::create($trait);
            }
        }
    }
}
