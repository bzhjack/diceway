<?php

namespace Database\Seeders;

use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolDesavantage;
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
                    ['carriere_id' => '23', 'value' => '2']
                ],
                'armures' => [
                    ['armure_id' => '2']
                ],
                'armes' => [
                    ['arme_id' => '15'],
                    ['arme_id' => '18']
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
                'carrieres' => [
                    ['carriere_id' => '3', 'value' => '2']
                ],
                'armures' => [
                    ['armure_id' => '2']
                ],
                'armes' => [
                    ['arme_id' => '4']
                ]
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
                'carrieres' => [
                    ['carriere_id' => '2', 'value' => '2']
                ],
                'armes' => [
                    ['arme_id' => '26'],
                    ['arme_id' => '19']
                ]
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
                'carrieres' => [
                    ['carriere_id' => '11', 'value' => '2']
                ],
                'armures' => [
                    ['armure_id' => '3'],
                    ['armure_id' => '6']
                ],
                'armes' => [
                    ['arme_id' => '21']
                ]
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
                'carrieres' => [
                    ['carriere_id' => '26', 'value' => '1'],
                    ['carriere_id' => '17', 'value' => '1']
                ],
                'armures' => [
                ],
                'armes' => [
                    ['arme_id' => '6'],
                    ['arme_id' => '3']
                ]
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
                'foi' => '2',
                'carrieres' => [
                    ['carriere_id' => '21', 'value' => '2'],
                ],
                'armures' => [
                ],
                'armes' => [
                    ['arme_id' => '18'],
                ]
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
                'carrieres' => [
                    ['carriere_id' => '23', 'value' => '1'],
                    ['carriere_id' => '6', 'value' => '1']
                ],
                'armures' => [
                    ['armure_id' => '2'],
                ],
                'armes' => [
                    ['arme_id' => '27'],
                    ['arme_id' => '19']
                ]
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
                'carrieres' => [
                    ['carriere_id' => '5', 'value' => '2']
                ],
                'armures' => [

                ],
                'armes' => [
                    ['arme_id' => '24'],
                    ['arme_id' => '16']
                ]
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
                'carrieres' => [
                    ['carriere_id' => '13', 'value' => '2'],
                ],
                'armures' => [

                ],
                'armes' => [
                    ['arme_id' => '22'],
                    ['arme_id' => '3']
                ]
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
                'carrieres' => [
                    ['carriere_id' => '18', 'value' => '1'],
                    ['carriere_id' => '20', 'value' => '1'],
                ],
                'armures' => [
                    ['armure_id' => '2'],
                ],
                'armes' => [
                    ['arme_id' => '21'],
                    ['arme_id' => '13']
                ]
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
                'carrieres' => [
                    ['carriere_id' => '23', 'value' => '2'],
                ],
                'armures' => [
                    ['armure_id' => '3'],
                    ['armure_id' => '6'],
                ],
                'armes' => [
                    ['arme_id' => '21'],
                    ['arme_id' => '6']
                ]
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
                'carrieres' => [
                    ['carriere_id' => '23', 'value' => '1'],
                    ['carriere_id' => '8', 'value' => '1'],
                ],
                'armures' => [
                    ['armure_id' => '6'],
                ],
                'armes' => [
                    ['arme_id' => '25'],
                    ['arme_id' => '8']
                ]
            ],
            [
                'id' => '13',
                'nom' => 'Methyn Sarr, la Reine Sorcière',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'R',

                'vigueur' => '0',
                'agilite' => '1',
                'esprit' => '4',
                'aura' => '3',

                'initiative' => '1',
                'melee' => '1',
                'tir' => '0',
                'defense' => '3',

                'vitalite' => '12',
                'vilenie' => '6',
                'foi' => '2',
                'pouvoir' => '16',
                'commentaire' => "Dague sanglante de Zaggath, d6 (arme mythique – dé de bonus aux jets d’attaque et de dégâts)",
                'carrieres' => [
                    ['carriere_id' => '24', 'value' => '4'],
                    ['carriere_id' => '18', 'value' => '1'],
                    ['carriere_id' => '4', 'value' => '1'],
                ],
                'armures' => [
                    ['armure_id' => '8'],
                ],
                'armes' => [
                    ['arme_id' => '3']
                ],
                'traits' => [
                    ['traitable_id' => '9', 'type' => 'A', 'traitable_type' => BolAvantage::class],
                    ['traitable_id' => '11', 'type' => 'A', 'traitable_type' => BolAvantage::class],
                    ['traitable_id' => '30', 'type' => 'A', 'traitable_type' => BolAvantage::class],
                    ['traitable_id' => '44', 'type' => 'A', 'traitable_type' => BolAvantage::class],

                    ['traitable_id' => '1', 'type' => 'D', 'traitable_type' => BolDesavantage::class, 'detail' => 'Sadisme'],
                    ['traitable_id' => '3', 'type' => 'D', 'traitable_type' => BolDesavantage::class],
                    ['traitable_id' => '18', 'type' => 'D', 'traitable_type' => BolDesavantage::class],
                    ['traitable_id' => '23', 'type' => 'D', 'traitable_type' => BolDesavantage::class],
                    ['traitable_id' => '30', 'type' => 'D', 'traitable_type' => BolDesavantage::class],
                ]
            ],
            [
                'id' => '14',
                'nom' => 'Jesharek Jool',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'R',

                'vigueur' => '0',
                'agilite' => '1',
                'esprit' => '3',
                'aura' => '1',

                'initiative' => '0',
                'melee' => '1',
                'tir' => '1',
                'defense' => '3',

                'vitalite' => '10',
                'heroisme' => '5',
                'foi' => '0',
                'pouvoir' => '12',
                'commentaire' => "Alchimiste et magicien renommé originaire de Tyrus",
                'carrieres' => [
                    ['carriere_id' => '1', 'value' => '4'],
                    ['carriere_id' => '24', 'value' => '2'],
                    ['carriere_id' => '10', 'value' => '1'],
                    ['carriere_id' => '22', 'value' => '2'],
                ],
                'armures' => [

                ],
                'armes' => [
                    ['arme_id' => '2'],
                    ['arme_id' => '3']
                ],
                'traits' => [
                    ['traitable_id' => '21', 'type' => 'A', 'traitable_type' => BolAvantage::class],
                    ['traitable_id' => '53', 'type' => 'A', 'traitable_type' => BolAvantage::class],
                    ['traitable_id' => '23', 'type' => 'D', 'traitable_type' => BolDesavantage::class],

                ]
            ],
            [
                'id' => '15',
                'nom' => 'Kalzatan l’Imposteur',
                'user_id' => null,
                'joueur' => 'master',
                'type' => 'R',

                'vigueur' => '1',
                'agilite' => '0',
                'esprit' => '3',
                'aura' => '0',

                'initiative' => '1',
                'melee' => '1',
                'tir' => '0',
                'defense' => '2',

                'vitalite' => '11',
                'vilenie' => '5',
                'foi' => '0',
                'pouvoir' => '15',
                'carrieres' => [
                    ['carriere_id' => '24', 'value' => '3'],
                    ['carriere_id' => '8', 'value' => '1'],
                    ['carriere_id' => '22', 'value' => '1'],
                    ['carriere_id' => '15', 'value' => '0'],
                ],
                'armures' => [

                ],
                'armes' => [
                    ['arme_id' => '21'],
                ],
                'traits' => [
                    ['traitable_id' => '26', 'type' => 'D', 'traitable_type' => BolDesavantage::class],
                    ['traitable_id' => '34', 'type' => 'D', 'traitable_type' => BolDesavantage::class, 'detail' => 'Pouvoir magique'],
                    ['traitable_id' => '43', 'type' => 'D', 'traitable_type' => BolDesavantage::class, 'detail' => 'Conseil des magiciens'],


                ]
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
