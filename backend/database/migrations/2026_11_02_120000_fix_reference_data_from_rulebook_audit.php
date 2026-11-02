<?php

use App\Http\Services\Bol\BolCache;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/** Corrections des données de référence relevées en relisant les seeders contre le livre (édition Mythic VF 1.3) ; les seeders portent
 * les mêmes corrections. Seules les fiches du catalogue (`user_id` nul) sont touchées : une fiche d'utilisateur du même nom reste telle
 * quelle, comme les copies déjà posées dans un scénario ou à une table. Les lignes sont retrouvées par leur nom ; une correction déjà
 * faite n'est pas refaite, les listes en cache sont vidées. */
return new class extends Migration
{
    /** Taille des créatures (livre p. 109, colonne « Exemples ») : nom => [id_taille avant, id_taille après]. */
    private const TAILLES = [
        'Cathgan' => [1, 2],                              // Très petite, pas Minuscule
        'Jemadar' => [7, 6],                              // Très grande, pas Énorme
        'Kalathorn' => [12, 10],                          // Gigantesque, pas Monstrueuse
        'Mythunga' => [9, 7],                             // Énorme, pas Colossale
        'Ours des cavernes / ours polaire' => [9, 7],     // Énorme, pas Colossale
        'Poad' => [10, 9],                                // Colossale, pas Gigantesque
        'Scorpion-araignée géant' => [11, 9],             // Colossale, pas Immense
        'Xolth' => [12, 11],                              // Immense, pas Monstrueuse
        'Zathog' => [6, 7],                               // Énorme, pas Très grande
    ];

    /** Précisions de capacité : [créature, capacité, texte avant, texte après]. Difficultés « Ardue (-1) » et « Impossible (-6) » du livre
     * (p. 110 et 122), d6 x2 à l'éclosion des œufs de jit (p. 118). */
    private const PRECISIONS = [
        [
            'Anguille chasseresse', 'Attaque spéciale',
            'Assomme sa proie avec une puissante décharge. Un héros doit réussir un jet de vigueur difficile (-1), sinon il perd connaissance pour 6 moins sa vigueur en rounds.',
            'Assomme sa proie avec une puissante décharge. Un héros doit réussir un jet de vigueur ardu (-1), sinon il perd connaissance pour 6 moins sa vigueur en rounds.',
        ],
        [
            'Jit', 'Attaque spéciale',
            'Sur un 1 au d6, la jit injecte des œufs. Si un médecin traite la plaie dans l’heure, il peut les retirer. Sinon, ils causent 1d6 dégâts s’ils sont extraits dans les 24 heures, ou 2d6 dégâts après ce délai.',
            'Sur un 1 au d6, la jit injecte des œufs. Si un médecin traite la plaie dans l’heure, il peut les retirer. Sinon, les extraire dans les 24 heures en rouvrant la plaie cause 1d6 dégâts ; passé ce délai, les araignées éclosent et causent d6x2 dégâts.',
        ],
        [
            'Sardolith', 'Attaque venimeuse',
            'Le poison tue immédiatement les créatures de taille petite ou moins. Les autres doivent réussir un jet de vigueur très difficile (-6) ou tomber dans un coma de 1d6 jours mortel sans antidote.',
            'Le poison tue immédiatement les créatures de taille petite ou moins. Les autres doivent réussir un jet de vigueur impossible (-6) ou tomber dans un coma de 1d6 jours mortel sans antidote.',
        ],
    ];

    /** Capacités absentes des morts-vivants (livre p. 127) : [id du seeder, créature, capacité, précision]. L'id du seeder est repris s'il
     * est libre, pour qu'un re-seed (updateOrCreate par id) retrouve la ligne au lieu de la doubler. */
    private const CAPACITES_MANQUANTES = [
        [3001, 'Main cavaleuse', 'Attaque spéciale', 'Face à une personne endormie, jet d\'attaque très facile (+2) qui ignore la défense de la cible, pour la saisir à la gorge. Elle l\'étrangle alors : d3 dégâts automatiques à chaque round. Il faut réussir un jet de vigueur moyen (+0) pour l\'arracher.'],
        [3002, 'Nécropède', 'Attaque féroce', null],
    ];

    private const SOIFFARD = [
        'Quand vous êtes chargé d’une tâche importante par vos compagnons, lancez un D6. Si vous obtenez un 1, vous échoué.',
        'Quand vous êtes chargé d’une tâche importante par vos compagnons, lancez un d6. Sur un 1, vous êtes ivre et incapable de faire quoi que ce soit jusqu’à ce que vous ayez dessoûlé.',
    ];

    private const PROGENITURE = [
        'Produit 1d6 rejetons par semaine, considérés comme piétaille la 1re semaine puis comme démons mineurs d\'une catégorie en dessous.',
        'Produit 1d6 rejetons par semaine : piétaille la 1re semaine, démons mineurs la suivante, et ainsi de suite, en restant d\'une catégorie en dessous de leur géniteur (un démon mineur n\'engendre que de la piétaille).',
    ];

    private const VUL_MAZZANLU = ['Vul’mazzanlu, la chose singe', 'Vul’mazzanlu, la chose-singe'];

    /** Défense 0 au livre (p. 135) : le petit bouclier qu'ils portent ajoute lui-même son +1 en combat. */
    private const PNJ_DEFENSE = ['Sergent du guet', 'Sentinelle kalukan'];

    private const METHYN_SARR = 'Methyn Sarr, la Reine Sorcière';

    public function up(): void
    {
        $now = now();

        foreach (self::TAILLES as $nom => [$avant, $apres]) {
            $this->creatures($nom)->where('id_taille', $avant)->update(['id_taille' => $apres, 'updated_at' => $now]);
        }
        foreach (self::PRECISIONS as [$creature, $capacite, $avant, $apres]) {
            $this->precision($creature, $capacite, $avant, $apres);
        }
        foreach (self::CAPACITES_MANQUANTES as [$id, $creature, $capacite, $detail]) {
            $capaciteId = DB::table('bol_capacite')->where('capacite', $capacite)->value('id');
            if ($capaciteId === null) {
                continue;
            }
            foreach ($this->creatures($creature)->pluck('id') as $creatureId) {
                $lien = DB::table('bol_creature_capacite')->where('creature_id', $creatureId)->where('capacite_id', $capaciteId);
                if ($lien->exists()) {
                    continue;
                }
                $ligne = ['creature_id' => $creatureId, 'capacite_id' => $capaciteId, 'detail' => $detail, 'created_at' => $now, 'updated_at' => $now];
                if (!DB::table('bol_creature_capacite')->where('id', $id)->exists()) {
                    $ligne = ['id' => $id, ...$ligne];
                }
                DB::table('bol_creature_capacite')->insert($ligne);
            }
        }

        $this->desavantageOomis('Deux mains gauches', 'Dur d’oreille');
        $this->mendiantASatarla(true);

        DB::table('bol_desavantage')->where('desavantage', 'Soiffard')->where('description', self::SOIFFARD[0])
            ->update(['description' => self::SOIFFARD[1], 'updated_at' => $now]);
        DB::table('bol_pouvoir')->where('pouvoir', 'Progéniture')->where('description', self::PROGENITURE[0])
            ->update(['description' => self::PROGENITURE[1], 'updated_at' => $now]);
        DB::table('bol_demon')->whereNull('user_id')->where('nom', self::VUL_MAZZANLU[0])
            ->update(['nom' => self::VUL_MAZZANLU[1], 'updated_at' => $now]);

        DB::table('bol_heros')->whereNull('user_id')->whereIn('nom', self::PNJ_DEFENSE)->where('defense', 1)
            ->update(['defense' => 0, 'updated_at' => $now]);
        $this->druidesse(true);

        $this->viderLesCaches();
    }

    public function down(): void
    {
        $now = now();

        foreach (self::TAILLES as $nom => [$avant, $apres]) {
            $this->creatures($nom)->where('id_taille', $apres)->update(['id_taille' => $avant, 'updated_at' => $now]);
        }
        foreach (self::PRECISIONS as [$creature, $capacite, $avant, $apres]) {
            $this->precision($creature, $capacite, $apres, $avant);
        }
        foreach (self::CAPACITES_MANQUANTES as [, $creature, $capacite, $detail]) {
            $capaciteId = DB::table('bol_capacite')->where('capacite', $capacite)->value('id');
            DB::table('bol_creature_capacite')
                ->whereIn('creature_id', $this->creatures($creature)->pluck('id'))
                ->where('capacite_id', $capaciteId)
                ->where('detail', $detail)
                ->delete();
        }

        $this->desavantageOomis('Dur d’oreille', 'Deux mains gauches');
        $this->mendiantASatarla(false);

        DB::table('bol_desavantage')->where('desavantage', 'Soiffard')->where('description', self::SOIFFARD[1])
            ->update(['description' => self::SOIFFARD[0], 'updated_at' => $now]);
        DB::table('bol_pouvoir')->where('pouvoir', 'Progéniture')->where('description', self::PROGENITURE[1])
            ->update(['description' => self::PROGENITURE[0], 'updated_at' => $now]);
        DB::table('bol_demon')->whereNull('user_id')->where('nom', self::VUL_MAZZANLU[1])
            ->update(['nom' => self::VUL_MAZZANLU[0], 'updated_at' => $now]);

        DB::table('bol_heros')->whereNull('user_id')->whereIn('nom', self::PNJ_DEFENSE)->where('defense', 0)
            ->update(['defense' => 1, 'updated_at' => $now]);
        $this->druidesse(false);

        $this->viderLesCaches();
    }

    /** Les créatures du catalogue de ce nom. */
    private function creatures(string $nom)
    {
        return DB::table('bol_creature')->whereNull('user_id')->where('nom', $nom);
    }

    private function precision(string $creature, string $capacite, ?string $avant, ?string $apres): void
    {
        $capaciteId = DB::table('bol_capacite')->where('capacite', $capacite)->value('id');
        DB::table('bol_creature_capacite')
            ->whereIn('creature_id', $this->creatures($creature)->pluck('id'))
            ->where('capacite_id', $capaciteId)
            ->where('detail', $avant)
            ->update(['detail' => $apres, 'updated_at' => now()]);
    }

    /** Oomis (livre p. 21) : « dur d'oreille » est dans sa liste de désavantages, « deux mains gauches » non. */
    private function desavantageOomis(string $avant, string $apres): void
    {
        $regionId = DB::table('bol_region')->where('region', 'Oomis')->value('id');
        $avantId = DB::table('bol_desavantage')->where('desavantage', $avant)->value('id');
        $apresId = DB::table('bol_desavantage')->where('desavantage', $apres)->value('id');
        if ($regionId === null || $avantId === null || $apresId === null) {
            return;
        }
        $liens = DB::table('bol_region_desavantage')->where('region_id', $regionId);
        if ((clone $liens)->where('desavantage_id', $apresId)->exists()) {
            // (region_id, desavantage_id) est unique : le bon lien existe déjà, il ne reste qu'à ôter le mauvais.
            (clone $liens)->where('desavantage_id', $avantId)->delete();
            return;
        }
        (clone $liens)->where('desavantage_id', $avantId)->update(['desavantage_id' => $apresId, 'updated_at' => now()]);
    }

    /** Satarla (livre p. 21) : la mendicité y est interdite, on ne peut pas y débuter mendiant. */
    private function mendiantASatarla(bool $interdire): void
    {
        $region = DB::table('bol_region')->where('region', 'Satarla')->first(['id', 'carrieres_interdites']);
        $mendiantId = DB::table('bol_carriere')->where('carriere', 'Mendiant')->value('id');
        if ($region === null || $mendiantId === null) {
            return;
        }
        $interdites = array_map('intval', json_decode($region->carrieres_interdites ?? '[]', true) ?: []);
        $sans = array_values(array_diff($interdites, [(int) $mendiantId]));
        $nouvelles = $interdire ? [...$sans, (int) $mendiantId] : $sans;
        DB::table('bol_region')->where('id', $region->id)->update([
            'carrieres_interdites' => $nouvelles === [] ? null : json_encode($nouvelles),
            'updated_at' => now(),
        ]);
    }

    /** Methyn Sarr (livre p. 136) : « Druidesse (de Zaggath) 2 », la carrière de prêtre de l'appli (druide/chaman). */
    private function druidesse(bool $ajouter): void
    {
        $herosIds = DB::table('bol_heros')->whereNull('user_id')->where('nom', self::METHYN_SARR)->pluck('id');
        $pretreId = DB::table('bol_carriere')->where('carriere', 'Prêtre')->value('id');
        if ($pretreId === null) {
            return;
        }
        foreach ($herosIds as $herosId) {
            $carriere = DB::table('bol_heros_carriere')->where('heros_id', $herosId)->where('carriere_id', $pretreId);
            if (!$ajouter) {
                $carriere->where('value', 2)->delete();
            } elseif (!$carriere->exists()) {
                DB::table('bol_heros_carriere')->insert([
                    'heros_id' => $herosId, 'carriere_id' => $pretreId, 'value' => 2, 'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }
    }

    /** Listes de référence (BolReferenceData) et listes de créatures et de démons de chaque compte, qui contiennent le catalogue. */
    private function viderLesCaches(): void
    {
        Cache::forget('bol_desavantages_all');
        Cache::forget('bol_regions_all');
        Cache::forget('bol_demon_pouvoirs');
        foreach (DB::table('users')->pluck('id') as $userId) {
            Cache::forget(BolCache::creatures((string) $userId));
            Cache::forget(BolCache::demons((string) $userId));
        }
    }
};
