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

        return $entries;
    }

    /**
     * Distribution d'une session : une entrée par ligne PNJ, créature puis démon. Une ligne dont la
     * fiche source a été supprimée est ignorée. Les héros n'en font jamais partie.
     *
     * @param array<int, array<string, mixed>> $pnjs      lignes avec `id`, `pnj_id`
     * @param array<int, array<string, mixed>> $creatures lignes avec `id`, `creature_id`, `qty`
     * @param array<int, array<string, mixed>> $demons    lignes avec `id`, `demon_id`, `qty`
     * @return array<int, array{kind: string, source_id: string, qty: int, camp: string, attitude: string|null}>
     */
    public static function fromSession(array $pnjs, array $creatures, array $demons): array
    {
        $entries = [];

        foreach ($pnjs as $row) {
            $sourceId = self::sourceId($row['pnj_id'] ?? null);
            if ($sourceId === null) {
                continue;
            }
            $entries[] = [
                'kind'      => 'pnj',
                'source_id' => $sourceId,
                'qty'       => 1,
                'camp'      => self::entryCamp($row),
                'attitude'  => self::entryAttitude($row),
            ];
        }

        foreach ([['creature', 'creature_id', $creatures], ['demon', 'demon_id', $demons]] as [$kind, $column, $rows]) {
            foreach ($rows as $row) {
                $sourceId = self::sourceId($row[$column] ?? null);
                if ($sourceId === null) {
                    continue;
                }
                $entries[] = [
                    'kind'      => $kind,
                    'source_id' => $sourceId,
                    'qty'       => max(1, (int) ($row['qty'] ?? 1)),
                    'camp'      => self::entryCamp($row),
                    'attitude'  => self::entryAttitude($row),
                ];
            }
        }

        return $entries;
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
