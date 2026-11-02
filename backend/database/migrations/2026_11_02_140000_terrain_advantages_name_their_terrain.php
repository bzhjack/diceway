<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/** Les six avantages de terrain avaient le même domaine de dé de bonus, sans dire où il s'applique. Le livre (chapitre 2, Avantages) le limite à leur
 * terrain et l'exclut du combat ; le seeder porte le même texte. Seul un texte encore d'origine est remplacé. */
return new class extends Migration
{
    private const TERRAINS = [
        'Fils des plaines' => 'Dans un paysage de plaine',
        'Montagnard' => 'Dans un paysage montagneux',
        'Pisteur des marais' => 'Dans un paysage de marécage',
        'Renard du désert' => 'Dans un désert',
        'Roi de la jungle' => 'Dans un paysage de jungle',
        'Tigre des neiges' => 'Dans un paysage neigeux',
    ];

    private const ANCIEN = 'Pister, piéger ou chasser, ainsi que pour d’autres activités similaires de survie';

    public function up(): void
    {
        foreach (self::TERRAINS as $avantage => $terrain) {
            DB::table('bol_avantage')
                ->where('avantage', $avantage)
                ->whereIn('de_bonus_domaine', [self::ANCIEN, self::ANCIEN . '.'])
                ->update(['de_bonus_domaine' => self::nouveau($terrain)]);
        }
    }

    public function down(): void
    {
        foreach (self::TERRAINS as $avantage => $terrain) {
            DB::table('bol_avantage')
                ->where('avantage', $avantage)
                ->where('de_bonus_domaine', self::nouveau($terrain))
                ->update(['de_bonus_domaine' => self::ANCIEN . '.']);
        }
    }

    private static function nouveau(string $terrain): string
    {
        return $terrain . ' : pister, piéger ou chasser, ainsi que d’autres activités similaires de survie (pas pour combattre).';
    }
};
