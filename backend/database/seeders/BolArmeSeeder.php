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
        // Table des armes alignée sur les 18 catégories du livre BoL, puis les 6 armes régionales de Mythic+ (ids 19 à 24).
        $armes = [
            [
                'id' => 1,
                'arme' => 'Arme d’hast',
                'type' => 'M',
                'degats' => 'd6B',
                'notes' => 'Arme à deux mains.'
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
                'degats' => 'd6M',
                'portee' => '3m',
                'notes' => 'Dissimulable; inclut poignard, coutelas...'
            ],
            [
                'id' => 4,
                'arme' => 'Épée',
                'type' => 'M',
                'degats' => 'd6',
                'notes' => 'Inclut cimeterre, glaive, sabre, tulwar...'
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
                'degats' => 'd6M',
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
                'degats' => 'd6M',
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
                'arme' => 'Fronde / bâton-fronde',
                'type' => 'T',
                'degats' => 'd6M',
                'portee' => '9m / 18m',
                'notes' => 'Arme à une main / arme à deux mains.'
            ],
            [
                'id' => 17,
                'arme' => 'Javelot / fléchette',
                'type' => 'T',
                'degats' => 'd6M',
                'portee' => '6m',
                'notes' => 'Arme de jet.'
            ],
            [
                'id' => 18,
                'arme' => 'Épée / hache à 2 mains',
                'type' => 'M',
                'degats' => 'd6B',
                'notes' => 'Armes à deux mains.'
            ],
            [
                'id' => 19,
                'arme' => 'Arc de guerre de Tyrus',
                'type' => 'T',
                'degats' => 'd6B',
                'portee' => '38m',
                'notes' => 'Arme à deux mains. Arme de Tyrus : seul un héros de Tyrus peut en faire son arme favorite.'
            ],
            [
                'id' => 20,
                'arme' => 'Fronde de l’Axos',
                'type' => 'T',
                'degats' => 'd6M',
                'portee' => '12m',
                'notes' => 'Arme des montagnards de l’Axos : seul un héros de l’Axos peut en faire son arme favorite.'
            ],
            [
                'id' => 21,
                'arme' => 'Hache d’abordage de Parsool',
                'type' => 'M',
                'degats' => 'd6 ou d6B',
                'notes' => 'Se manie à une ou deux mains. Arme des marins de Parsool : seul un héros de Parsool peut en faire son arme favorite.'
            ],
            [
                'id' => 22,
                'arme' => 'Khastok',
                'type' => 'M',
                'degats' => 'd6B+1',
                'notes' => 'Arme à deux mains ; lance de la Garde Jemadar. Arme de Malakut : seul un héros de Malakut peut en faire son arme favorite.'
            ],
            [
                'id' => 23,
                'arme' => 'Kriss',
                'type' => 'M',
                'degats' => 'd6M+1',
                'notes' => 'Dissimulable ; dague à lame sinueuse. Arme de Halakh : seul un héros de Halakh peut en faire son arme favorite.'
            ],
            [
                'id' => 24,
                'arme' => 'Épée valgardienne',
                'type' => 'M',
                'degats' => 'd6 ou d6B',
                'notes' => 'Se manie à une ou deux mains. Arme de Valgard : seul un héros de Valgard peut en faire son arme favorite.'
            ],
        ];
        BolArme::truncate();
        foreach ($armes as $arme) {
            BolArme::create($arme);
        }
    }
}
