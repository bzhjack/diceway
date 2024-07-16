<?php

namespace Database\Seeders;

use App\Models\Bol\BolArme;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BolArmeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $armes = [
            [
                'id' => 1,
                'arme' => 'Arme d’hast',
                'type' => 'M',
                'degats' => 'd6B',
                'notes' => 'Inclut le khastok de Malakut.'
            ],
            [
                'id' => 2,
                'arme' => 'Bâton',
                'type' => 'M',
                'degats' => 'd6',
                'notes' => 'Armes à deux mains.'
            ],
            [
                'id' => 3,
                'arme' => 'Dague',
                'type' => 'M',
                'degats' => 'd6',
                'portee' => '3m',
                'notes' => 'Dissimulable; inclut kriss, poignard, coutelas...'
            ],
            [
                'id' => 4,
                'arme' => 'Épée/hache à deux mains',
                'type' => 'M',
                'degats' => 'd6B',
                'notes' => 'Armes à deux mains'
            ],
            [
                'id' => 5,
                'arme' => 'Fléau',
                'type' => 'M',
                'degats' => 'd6',
                'notes' => 'Ignore les boucliers.'
            ],
            [
                'id' => 6,
                'arme' => 'Gourdin',
                'type' => 'M',
                'degats' => 'd6',
                'notes' => 'Option : dégâts non létaux.'
            ],
            [
                'id' => 7,
                'arme' => 'Hache',
                'type' => 'M',
                'degats' => 'd6',
                'portee' => '3m',
                'notes' => 'Peut être lancée.'
            ],
            [
                'id' => 8,
                'arme' => 'Lance',
                'type' => 'M',
                'degats' => 'd6',
                'portee' => '6m',
                'notes' => 'Peut être lancée.'
            ],
            [
                'id' => 9,
                'arme' => 'Masse d’armes',
                'type' => 'M',
                'degats' => 'd6',
                'portee' => '1,5m',
                'notes' => 'Peut être lancée.'
            ],
            [
                'id' => 10,
                'arme' => 'Massue',
                'type' => 'M',
                'degats' => 'd6',
                'portee' => '3m',
                'notes' => 'Peut être lancée.'
            ],
            [
                'id' => 11,
                'arme' => 'Morgenstern',
                'type' => 'M',
                'degats' => 'd6B',
                'notes' => 'Arme à deux mains'
            ],
            [
                'id' => 12,
                'arme' => 'Rapière',
                'type' => 'M',
                'degats' => 'd6',
                'notes' => 'Très chic !'
            ],
            [
                'id' => 13,
                'arme' => 'Arbalète',
                'type' => 'T',
                'degats' => 'd6',
                'portee' => '30m',
                'notes' => 'Arme à deux mains ; rechargement : 1 round de combat'
            ],
            [
                'id' => 14,
                'arme' => 'Arbalète lourde',
                'type' => 'T',
                'degats' => 'd6B',
                'portee' => '45m',
                'notes' => 'Arme à deux mains ; rechargement : 2 rounds de combat'
            ],
            [
                'id' => 15,
                'arme' => 'Arc',
                'type' => 'T',
                'degats' => 'd6',
                'portee' => '22m',
                'notes' => 'Arme à deux mains'
            ],
            [
                'id' => 16,
                'arme' => 'Fronde/bâton-fronde',
                'type' => 'T',
                'degats' => 'd6M',
                'portee' => '9m/18m',
                'notes' => 'Arme à une main/arme à deux mains'
            ],
            [
                'id' => 17,
                'arme' => 'Javelot/fléchette',
                'type' => 'T',
                'degats' => 'd6M',
                'portee' => '6m',
                'notes' => 'Arme de jet'
            ],
            // Ajoutez d'autres armes si nécessaire
        ];
        BolArme::truncate();
        foreach ($armes as $arme) {
            BolArme::create($arme);
        }
    }
}
