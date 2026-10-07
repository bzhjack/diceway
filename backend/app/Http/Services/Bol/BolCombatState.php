<?php

namespace App\Http\Services\Bol;

/**
 * État d'un combat en cours, gardé dans `bol_fight_session.etat_combat` : le round, les cartes qui
 * ont joué ce round et celles en défense totale. Les clés de carte sont celles du front
 * (`{kind}-{pivotId}`, ex. `creature-12`). Fonctions pures, sans base.
 */
class BolCombatState
{
    public const INITIAL = ['round' => 1, 'joues' => [], 'defense_totale' => []];

    /**
     * État valide à partir de n'importe quelle valeur lue ou reçue : un état absent ou mal formé
     * (combat démarré avant que l'état n'existe) vaut le round 1, personne n'ayant joué.
     *
     * @return array{round: int, joues: array<int, string>, defense_totale: array<int, string>}
     */
    public static function normalize(mixed $raw): array
    {
        if (!is_array($raw)) {
            return self::INITIAL;
        }

        return [
            'round'          => max(1, (int) (is_numeric($raw['round'] ?? null) ? $raw['round'] : 1)),
            'joues'          => self::keys($raw['joues'] ?? null),
            'defense_totale' => self::keys($raw['defense_totale'] ?? null),
        ];
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
}
