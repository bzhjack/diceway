<?php

namespace App\Http\Services\Bol;

/**
 * Fonctions pures (sans base) autour de la distribution d'une scène : la liste des personnages
 * non-héros d'une table, avec leur nombre d'exemplaires, leur camp et leur attitude.
 */
class BolSceneDistribution
{
    /** Attitudes possibles d'un personnage en scène envers les héros. */
    public const ATTITUDES = ['hostile', 'mefiant', 'neutre', 'amical'];

    /** Au plus, les lignes d'une distribution saisie dans « Préparer la scène ». */
    public const SAISIE_MAX = 60;

    /** Au plus, les exemplaires d'un personnage (PNJ, créature, démon) sur une ligne. */
    public const QTY_MAX = 30;

    /**
     * Une entrée par personnage : les entrées de la même fiche, du même camp et de la même attitude n'en font qu'une, à la place
     * de la première, avec la somme de leurs exemplaires (au plus `QTY_MAX`) ; « Préparer la scène » et la table en font un
     * paquet (« ×5 »).
     *
     * @param array<int, array{kind: string, source_id: string, qty: int, camp: string, attitude: string|null}> $entries
     * @return list<array{kind: string, source_id: string, qty: int, camp: string, attitude: string|null}>
     */
    public static function regroupee(array $entries): array
    {
        $result = [];
        $index = [];
        foreach ($entries as $entry) {
            $cle = implode("\0", [$entry['kind'], $entry['source_id'], $entry['camp'], $entry['attitude'] ?? '']);
            if (isset($index[$cle])) {
                $result[$index[$cle]]['qty'] = min(self::QTY_MAX, $result[$index[$cle]]['qty'] + $entry['qty']);
                continue;
            }
            $index[$cle] = count($result);
            $result[] = $entry;
        }

        return $result;
    }

    /**
     * Distribution saisie dans « Préparer la scène » : les entrées dont la fiche est accessible au compte (`accessibles`, clés
     * `kind:source_id`), avec leur nombre d'exemplaires (un PNJ aussi : trois gardes d'une même fiche), le camp et l'attitude normalisés.
     *
     * @param array<int, array<string, mixed>> $saisie
     * @param array<int, string>               $accessibles
     * @return array<int, array{kind: string, source_id: string, qty: int, camp: string, attitude: string|null}>
     */
    public static function fromSaisie(array $saisie, array $accessibles): array
    {
        $entries = [];
        foreach ($saisie as $entree) {
            $kind = (string) ($entree['kind'] ?? '');
            $sourceId = self::sourceId($entree['source_id'] ?? null);
            $cle = $kind . ':' . $sourceId;
            if ($sourceId === null || !in_array($cle, $accessibles, true)) {
                continue;
            }
            $entries[] = [
                'kind'      => $kind,
                'source_id' => $sourceId,
                'qty'       => min(self::QTY_MAX, max(1, (int) ($entree['qty'] ?? 1))),
                'camp'      => self::entryCamp($entree),
                'attitude'  => self::entryAttitude($entree),
            ];
        }

        return self::regroupee($entries);
    }

    /**
     * Camp d'une entrée de distribution (ou d'une ligne de session) : `heros` pour un allié,
     * `adversaires` dans tous les autres cas — y compris les scènes enregistrées avant que le camp
     * n'existe, dont les entrées n'ont pas ce champ.
     *
     * @param array<string, mixed> $entry
     */
    public static function entryCamp(array $entry): string
    {
        return ($entry['camp'] ?? null) === 'heros' ? 'heros' : 'adversaires';
    }

    /**
     * Attitude d'une entrée de distribution (ou d'une ligne de session) envers les héros : une des
     * `ATTITUDES`, sinon null (aucune, ou scène enregistrée avant que l'attitude n'existe).
     *
     * @param array<string, mixed> $entry
     */
    public static function entryAttitude(array $entry): ?string
    {
        $attitude = $entry['attitude'] ?? null;

        return in_array($attitude, self::ATTITUDES, true) ? $attitude : null;
    }

    private static function sourceId(mixed $raw): ?string
    {
        return $raw === null || $raw === '' ? null : (string) $raw;
    }
}
