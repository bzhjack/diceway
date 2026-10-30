<?php

namespace App\Http\Services\Bol;

/**
 * État d'un combat en cours, gardé dans `bol_fight_session.etat_combat` : le round, les cartes qui ont joué ce round,
 * les effets en cours (bonus, malus et traces d'usage : posture, défense totale, petit bouclier dépensé…), les cartes
 * exclues de ce combat (restées sur la table, mais qui n'y participent pas : elles réintègrent la scène à la fin du
 * combat) et la vitalité de chaque carte au début du combat (la récupération d'après combat rend la moitié des points perdus
 * pendant ce combat, pas des blessures plus anciennes), et le dé du MJ pour tous (`deMj` : `bonus`, `malus` ou `null`), qui s'ajoute à chaque
 * jet d'attaque des héros tant qu'il est choisi. Les clés de carte sont celles du front (`{kind}-{pivotId}`, ex. `creature-12`). Le backend valide la forme des
 * effets sans connaître les règles. Fonctions pures, sans base.
 */
class BolCombatState
{
    public const INITIAL = ['round' => 1, 'joues' => [], 'effets' => [], 'exclus' => [], 'depart' => [], 'deMj' => null];

    private const DES_MJ = ['bonus', 'malus'];

    private const MAX_EFFETS = 200;
    private const MAX_DEPART = 200;
    private const MAX_ID = 40;
    private const MAX_CARTE = 60;
    private const STATS = ['attaque', 'defense', 'degats', 'protection', 'action'];
    private const QUAND = ['attaque', 'subie'];
    private const DUREES = ['usages', 'fin-round', 'debut-tour-porteur', 'action-porteur', 'combat'];

    /**
     * État valide à partir de n'importe quelle valeur lue ou reçue : un état absent ou mal formé
     * (combat démarré avant que l'état n'existe) vaut le round 1, personne n'ayant joué. Un état de l'ancien format
     * (`defense_totale`, `attaquees`) est converti en effets.
     *
     * @return array{round: int, joues: array<int, string>, effets: array<int, array<string, mixed>>, exclus: array<int, string>, depart: array<string, int>, deMj: ?string}
     */
    public static function normalize(mixed $raw): array
    {
        if (!is_array($raw)) {
            return self::INITIAL;
        }

        return [
            'round'  => max(1, (int) (is_numeric($raw['round'] ?? null) ? $raw['round'] : 1)),
            'joues'  => self::keys($raw['joues'] ?? null),
            'effets' => array_key_exists('effets', $raw) ? self::effets($raw['effets']) : self::effetsDeLAncienFormat($raw),
            'exclus' => self::keys($raw['exclus'] ?? null),
            'depart' => self::depart($raw['depart'] ?? null),
            'deMj'   => in_array($raw['deMj'] ?? null, self::DES_MJ, true) ? $raw['deMj'] : null,
        ];
    }

    /**
     * Un état envoyé par le front, complété par ce qui est déjà gardé : les cartes exclues sont fixées au démarrage, les effets ne sont pas
     * réécrits par un état envoyé sans eux, le dé du MJ pour tous non plus (envoyé à `null`, il est retiré), et la vitalité de départ ne
     * vient que du démarrage (le front ne peut pas la changer).
     *
     * @param array<string, mixed> $envoye
     * @return array{round: int, joues: array<int, string>, effets: array<int, array<string, mixed>>, exclus: array<int, string>, depart: array<string, int>, deMj: ?string}
     */
    public static function merge(array $envoye, mixed $existant): array
    {
        $garde = self::normalize($existant);
        $envoye['exclus'] ??= $garde['exclus'];
        $envoye['effets'] ??= $garde['effets'];
        $envoye['depart'] = $garde['depart'];
        if (!array_key_exists('deMj', $envoye)) {
            $envoye['deMj'] = $garde['deMj'];
        }

        return self::normalize($envoye);
    }

    /** @return array<int, string> clés de carte uniques, dans leur ordre d'apparition */
    private static function keys(mixed $raw): array
    {
        if (!is_array($raw)) {
            return [];
        }

        $keys = array_filter($raw, fn ($key) => is_string($key) && $key !== '');

        return array_values(array_unique($keys));
    }

    /** @return array<string, int> clé de carte => vitalité au début du combat ; les entrées mal formées sont écartées */
    private static function depart(mixed $raw): array
    {
        if (!is_array($raw)) {
            return [];
        }

        $depart = [];
        foreach ($raw as $key => $vitalite) {
            if (!is_string($key) || $key === '' || mb_strlen($key) > self::MAX_CARTE || !is_int($vitalite) || $vitalite < -100 || $vitalite > 1000) {
                continue;
            }
            $depart[$key] = $vitalite;
            if (count($depart) >= self::MAX_DEPART) {
                break;
            }
        }

        return $depart;
    }

    /** @return array<int, array<string, mixed>> */
    private static function effets(mixed $raw): array
    {
        if (!is_array($raw)) {
            return [];
        }

        $effets = [];
        $ids = [];
        foreach ($raw as $candidat) {
            $effet = self::effet($candidat);
            if ($effet === null || isset($ids[$effet['id']])) {
                continue;
            }
            $ids[$effet['id']] = true;
            $effets[] = $effet;
            if (count($effets) >= self::MAX_EFFETS) {
                break;
            }
        }

        return $effets;
    }

    /** @return array<string, mixed>|null l'effet nettoyé, ou null s'il est invalide */
    private static function effet(mixed $raw): ?array
    {
        if (!is_array($raw)) {
            return null;
        }
        foreach (['id' => self::MAX_ID, 'origine' => self::MAX_ID, 'porteur' => self::MAX_CARTE] as $champ => $max) {
            if (!is_string($raw[$champ] ?? null) || $raw[$champ] === '' || mb_strlen($raw[$champ]) > $max) {
                return null;
            }
        }
        if (isset($raw['cible']) && (!is_string($raw['cible']) || mb_strlen($raw['cible']) > self::MAX_CARTE)) {
            return null;
        }
        $valeur = $raw['valeur'] ?? null;
        if (!is_int($valeur) || $valeur < -20 || $valeur > 20) {
            return null;
        }
        if (!in_array($raw['stat'] ?? null, self::STATS, true) || !in_array($raw['quand'] ?? null, self::QUAND, true)) {
            return null;
        }
        $duree = self::duree($raw['duree'] ?? null);
        if ($duree === null) {
            return null;
        }

        $effet = [
            'id'      => $raw['id'],
            'origine' => $raw['origine'],
            'porteur' => $raw['porteur'],
            'stat'    => $raw['stat'],
            'valeur'  => $valeur,
            'quand'   => $raw['quand'],
            'duree'   => $duree,
            'manuel'  => ($raw['manuel'] ?? false) === true,
        ];
        if (is_string($raw['cible'] ?? null) && $raw['cible'] !== '') {
            $effet['cible'] = $raw['cible'];
        }
        if (is_string($raw['libelle'] ?? null) && $raw['libelle'] !== '') {
            $effet['libelle'] = mb_substr($raw['libelle'], 0, 60);
        }

        return $effet;
    }

    /** @return array<string, mixed>|null */
    private static function duree(mixed $raw): ?array
    {
        if (!is_array($raw) || !in_array($raw['type'] ?? null, self::DUREES, true)) {
            return null;
        }
        if ($raw['type'] !== 'usages') {
            return ['type' => $raw['type']];
        }
        $restants = $raw['restants'] ?? null;
        if (!is_int($restants) || $restants < 1 || $restants > 20) {
            return null;
        }
        $duree = ['type' => 'usages', 'restants' => $restants];
        if (($raw['expireAuTour'] ?? false) === true) {
            $duree['expireAuTour'] = true;
        }

        return $duree;
    }

    /**
     * Effets équivalents à l'ancien état : chaque carte en défense totale reçoit +2 jusqu'à son prochain tour, chaque carte
     * déjà attaquée ce round une trace « bouclier dépensé ».
     *
     * @return array<int, array<string, mixed>>
     */
    private static function effetsDeLAncienFormat(array $raw): array
    {
        $effets = [];
        foreach (self::keys($raw['defense_totale'] ?? null) as $porteur) {
            $effets[] = ['origine' => 'defense-totale', 'porteur' => $porteur, 'stat' => 'defense', 'valeur' => 2, 'quand' => 'subie', 'duree' => ['type' => 'debut-tour-porteur'], 'manuel' => false];
        }
        foreach (self::keys($raw['attaquees'] ?? null) as $porteur) {
            $effets[] = ['origine' => 'bouclier-depense', 'porteur' => $porteur, 'stat' => 'defense', 'valeur' => 0, 'quand' => 'subie', 'duree' => ['type' => 'fin-round'], 'manuel' => false];
        }

        return array_map(fn (array $effet, int $i) => ['id' => 'e-' . ($i + 1)] + $effet, $effets, array_keys($effets));
    }
}
