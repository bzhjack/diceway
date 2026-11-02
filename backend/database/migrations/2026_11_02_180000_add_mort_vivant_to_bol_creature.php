<?php

use App\Http\Services\Bol\BolCache;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Les morts-vivants n'ont pas de vitalité mais une force vitale ; à 0, ils retournent à la mort (Bestiaire, p. 127). La créature le dit
 * (`mort_vivant`), et la copie posée à une table aussi (`bol_fight_session_creature`, qui recopie les fiches) : l'écran de combat écrit
 * alors « Force vitale » et « détruit ». La case est posée sur les morts-vivants du catalogue (`user_id` nul), reconnus à leur nom, et
 * sur leurs copies déjà posées à une table ; une créature de compte n'est jamais touchée, son MJ coche la case. */
return new class extends Migration
{
    /** Le livre (p. 127-128), La Perle du Beshaar (momies noires, p. 32-33) et les Chroniques Lémuriennes (p. 24-26 : le gardien momifié,
     * le fantôme leng shi, les revenants mogmaï et windoku). */
    private const MORTS_VIVANTS = [
        'Main cavaleuse',
        'Nécropède',
        'Nécrophage',
        'Roi-Sorcier mort-vivant',
        "Momie noire d'humain",
        'Momie noire de coursier des sables',
        'Gardien du Royaume Putride',
        'Leng shi',
        'Mogmaï',
        'Windoku',
    ];

    public function up(): void
    {
        foreach (['bol_creature', 'bol_fight_session_creature'] as $table) {
            if (!Schema::hasColumn($table, 'mort_vivant')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->boolean('mort_vivant')->default(false);
                });
            }
        }

        $catalogue = DB::table('bol_creature')->whereNull('user_id')->whereIn('nom', self::MORTS_VIVANTS);
        $catalogue->update(['mort_vivant' => true]);
        DB::table('bol_fight_session_creature')->whereIn('creature_id', $catalogue->pluck('id'))->update(['mort_vivant' => true]);

        $this->viderLesCaches();
    }

    public function down(): void
    {
        foreach (['bol_creature', 'bol_fight_session_creature'] as $table) {
            if (Schema::hasColumn($table, 'mort_vivant')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->dropColumn('mort_vivant');
                });
            }
        }

        $this->viderLesCaches();
    }

    private function viderLesCaches(): void
    {
        foreach (DB::table('users')->pluck('id') as $userId) {
            Cache::forget(BolCache::creatures((string) $userId));
        }
    }
};
