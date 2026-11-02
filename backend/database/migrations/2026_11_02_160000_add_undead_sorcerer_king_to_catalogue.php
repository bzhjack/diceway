<?php

use App\Http\Services\Bol\BolCache;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/** Le Roi-Sorcier mort-vivant du livre (Bestiaire, p. 128) rejoint le catalogue ; le seeder porte la même fiche. Les squelettes et les
 * zombies n'ont pas de profil (piétaille) : ils n'y sont pas. Les bases déjà remplies le reçoivent ici ; une base neuve, dont les tailles
 * ne sont pas encore posées (une créature sans taille casse la liste), le reçoit du seeder. Seul le catalogue (`user_id` nul)
 * est regardé : une créature de compte du même nom ne bloque rien et n'est jamais touchée. Aucune capacité du seeder ne lui convient
 * (Magie des Rois-Sorciers est un avantage, Inquiétant un désavantage) : elles sont dans le commentaire, comme pour les autres morts-vivants. */
return new class extends Migration
{
    private const NOM = 'Roi-Sorcier mort-vivant';

    /** L'id du seeder : repris s'il est libre, pour qu'un re-seed (updateOrCreate par id) retrouve la ligne au lieu de la doubler. */
    private const ID_DU_SEEDER = '75';

    /** Livre p. 128 : Vigueur 3, Agilité 0, Esprit 3, Force vitale 13 (colonne vitalité), Attaque +2, Dégâts d6+3 (épée), Défense 2, Protection 0.
     * Le livre ne donne ni taille ni rang : « Moyenne » (4) fait 13 = 10 + vigueur 3 et d6 + vigueur 3. */
    private const PROFIL = [
        'vigueur' => 3,
        'agilite' => 0,
        'esprit' => 3,
        'vitalite' => 13,
        'attaque' => 2,
        'defense' => 2,
        'degats' => 'd6+3',
        'protection' => '0',
        'id_taille' => 4,
    ];

    private const COMMENTAIRE = "Bestiaire, p. 128. Cryptes obscures et souterrains perdus. Visage blafard et squelettique, proche des morgal ; d'une malfaisance démente, il attend l'heure de gouverner de nouveau le monde.\nLe livre ne donne ni taille ni rang : taille « Moyenne » retenue (force vitale 13 = vitalité 10 + vigueur 3 ; dégâts d6+3 = d6 + vigueur 3, à l'épée). Avec ses carrières, il se joue comme un rival.\nForce vitale 13 : mort-vivant, il n'a pas de vitalité et ne souffre pas des blessures ; à 0, il retourne à la mort.\nPoints de pouvoir : 15. Carrières : Sorcier 3-6.\nMagie des Rois-Sorciers : un dé de bonus pour lancer des sorts. Pouvoir du Néant : inclus dans le profil.\nInquiétant : un dé de malus dans les situations sociales ou face à des animaux. Deux autres désavantages au choix.";

    public function up(): void
    {
        if ($this->catalogue()->exists() || !DB::table('bol_taille')->where('id', self::PROFIL['id_taille'])->exists()) {
            return;
        }

        $now = now();
        $id = DB::table('bol_creature')->where('id', self::ID_DU_SEEDER)->exists() ? (string) Str::uuid() : self::ID_DU_SEEDER;
        DB::table('bol_creature')->insert([
            'id' => $id,
            'user_id' => null,
            'nom' => self::NOM,
            ...self::PROFIL,
            'commentaire' => self::COMMENTAIRE,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $this->viderLesCaches();
    }

    public function down(): void
    {
        $ids = $this->catalogue()->pluck('id');
        DB::table('bol_creature_capacite')->whereIn('creature_id', $ids)->delete();
        DB::table('bol_creature')->whereIn('id', $ids)->delete();

        $this->viderLesCaches();
    }

    private function catalogue()
    {
        return DB::table('bol_creature')->whereNull('user_id')->where('nom', self::NOM);
    }

    private function viderLesCaches(): void
    {
        foreach (DB::table('users')->pluck('id') as $userId) {
            Cache::forget(BolCache::creatures((string) $userId));
        }
    }
};
