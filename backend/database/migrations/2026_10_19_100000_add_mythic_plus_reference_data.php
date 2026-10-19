<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/** Mise à jour vers l'édition Mythic+ (doc/pdf-text/07-maj-mythic-plus.txt) : trois avantages, un désavantage et six armes
 * régionales ; la dague et l'arme d'hast n'incluent plus le kriss et le khastok, devenus des armes à part. Les lignes déjà
 * présentes (même nom) sont laissées telles quelles ; les listes en cache sont vidées. */
return new class extends Migration
{
    private const AVANTAGES = [
        [
            'avantage' => 'Maître artisan',
            'description' => 'Vous obtenez des points de création comme un alchimiste, mais uniquement pour produire des armes, armures et outils de qualité courante ou rare. Vous pouvez aider un alchimiste à créer des machines ou des instruments (pas des potions) en ajoutant vos points aux siens. Vous devez posséder la carrière forgeron.',
        ],
        [
            'avantage' => 'Prestance',
            'attribut' => 'aura',
            'attribut_bonus' => 1,
            'description' => 'Votre score maximum en aura passe à 6 au lieu de 5, et votre score de départ maximum à 4 (au lieu de 3).',
        ],
        [
            'avantage' => 'Envoûtant',
            'description' => 'Une fois par jour, vous obtenez l’aide empressée d’un nombre de piétailles égal à votre aura + d6, qui feront de leur mieux pour vous plaire, même à leurs risques. Vous devez posséder la carrière tentatrice.',
        ],
    ];

    private const DESAVANTAGES = [
        [
            'desavantage' => 'Méfiance envers les inconnus',
            'description' => 'Vous doutez systématiquement de l’honnêteté et de la fiabilité des inconnus : vous les surveillez, ne vous confiez pas devant eux et n’accédez à leurs requêtes qu’en maugréant. À interpréter en jeu.',
        ],
    ];

    private const ARMES = [
        ['arme' => 'Arc de guerre de Tyrus', 'type' => 'T', 'degats' => 'd6B', 'portee' => '38m', 'notes' => 'Arme à deux mains. Arme de Tyrus : seul un héros de Tyrus peut en faire son arme favorite.'],
        ['arme' => 'Fronde de l’Axos', 'type' => 'T', 'degats' => 'd6M', 'portee' => '12m', 'notes' => 'Arme des montagnards de l’Axos : seul un héros de l’Axos peut en faire son arme favorite.'],
        ['arme' => 'Hache d’abordage de Parsool', 'type' => 'M', 'degats' => 'd6 ou d6B', 'portee' => null, 'notes' => 'Se manie à une ou deux mains. Arme des marins de Parsool : seul un héros de Parsool peut en faire son arme favorite.'],
        ['arme' => 'Khastok', 'type' => 'M', 'degats' => 'd6B+1', 'portee' => null, 'notes' => 'Arme à deux mains ; lance de la Garde Jemadar. Arme de Malakut : seul un héros de Malakut peut en faire son arme favorite.'],
        ['arme' => 'Kriss', 'type' => 'M', 'degats' => 'd6M+1', 'portee' => null, 'notes' => 'Dissimulable ; dague à lame sinueuse. Arme de Halakh : seul un héros de Halakh peut en faire son arme favorite.'],
        ['arme' => 'Épée valgardienne', 'type' => 'M', 'degats' => 'd6 ou d6B', 'portee' => null, 'notes' => 'Se manie à une ou deux mains. Arme de Valgard : seul un héros de Valgard peut en faire son arme favorite.'],
    ];

    /** Notes de la dague et de l'arme d'hast : avant (édition Mythic) et après (Mythic+). */
    private const NOTES = [
        'Arme d’hast' => ['Inclut le khastok de Malakut.', 'Arme à deux mains.'],
        'Dague' => ['Dissimulable; inclut kriss, poignard, coutelas...', 'Dissimulable; inclut poignard, coutelas...'],
    ];

    public function up(): void
    {
        $now = now();
        foreach (self::AVANTAGES as $avantage) {
            if (!DB::table('bol_avantage')->where('avantage', $avantage['avantage'])->exists()) {
                DB::table('bol_avantage')->insert([...$avantage, 'created_at' => $now, 'updated_at' => $now]);
            }
        }
        foreach (self::DESAVANTAGES as $desavantage) {
            if (!DB::table('bol_desavantage')->where('desavantage', $desavantage['desavantage'])->exists()) {
                DB::table('bol_desavantage')->insert([...$desavantage, 'created_at' => $now, 'updated_at' => $now]);
            }
        }
        foreach (self::ARMES as $arme) {
            if (!DB::table('bol_arme')->whereNull('user_id')->where('arme', $arme['arme'])->exists()) {
                DB::table('bol_arme')->insert([...$arme, 'created_at' => $now, 'updated_at' => $now]);
            }
        }
        foreach (self::NOTES as $arme => [, $apres]) {
            DB::table('bol_arme')->whereNull('user_id')->where('arme', $arme)->update(['notes' => $apres, 'updated_at' => $now]);
        }
        $this->viderLesCaches();
    }

    public function down(): void
    {
        DB::table('bol_avantage')->whereIn('avantage', array_column(self::AVANTAGES, 'avantage'))->delete();
        DB::table('bol_desavantage')->whereIn('desavantage', array_column(self::DESAVANTAGES, 'desavantage'))->delete();
        DB::table('bol_arme')->whereNull('user_id')->whereIn('arme', array_column(self::ARMES, 'arme'))->delete();
        foreach (self::NOTES as $arme => [$avant]) {
            DB::table('bol_arme')->whereNull('user_id')->where('arme', $arme)->update(['notes' => $avant]);
        }
        $this->viderLesCaches();
    }

    /** Les listes d'avantages et de désavantages, et celle des armes de chaque utilisateur (BolTraitController, BolArmeController). */
    private function viderLesCaches(): void
    {
        Cache::forget('bol_avantages_all');
        Cache::forget('bol_desavantages_all');
        foreach (DB::table('users')->pluck('id') as $userId) {
            Cache::forget('bol_armes_all_' . $userId);
        }
    }
};
