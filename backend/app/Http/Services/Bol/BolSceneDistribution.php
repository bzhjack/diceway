<?php

namespace App\Http\Services\Bol;

/**
 * Fonctions pures (sans base) autour de la distribution d'une scène : la liste des personnages
 * non-héros d'une table, avec quantité et position par exemplaire. Les clés de jeton sont celles du
 * front (`combat-play.util.ts`) : `pnj-{id}`, `creature-{id}-{i}`, `demon-{id}-{i}`, `hero-{id}`.
 */
class BolSceneDistribution
{
    /**
     * Distribution d'une session : une entrée par ligne PNJ, créature puis démon. Une ligne dont la
     * fiche source a été supprimée est ignorée. Les héros n'en font jamais partie.
     *
     * @param array<int, array<string, mixed>> $pnjs      lignes avec `id`, `pnj_id`
     * @param array<int, array<string, mixed>> $creatures lignes avec `id`, `creature_id`, `qty`
     * @param array<int, array<string, mixed>> $demons    lignes avec `id`, `demon_id`, `qty`
     * @param array<string, mixed>|null        $positions `positions_jetons` de la session
     * @return array<int, array{kind: string, source_id: string, qty: int, positions: array<int, array{x: float, y: float}|null>}>
     */
    public static function fromSession(array $pnjs, array $creatures, array $demons, ?array $positions): array
    {
        $positions ??= [];
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
                'positions' => [self::position($positions['pnj-' . $row['id']] ?? null)],
            ];
        }

        foreach ([['creature', 'creature_id', $creatures], ['demon', 'demon_id', $demons]] as [$kind, $column, $rows]) {
            foreach ($rows as $row) {
                $sourceId = self::sourceId($row[$column] ?? null);
                if ($sourceId === null) {
                    continue;
                }
                $qty = max(1, (int) ($row['qty'] ?? 1));
                $instancePositions = [];
                for ($i = 0; $i < $qty; $i++) {
                    $instancePositions[] = self::position($positions[$kind . '-' . $row['id'] . '-' . $i] ?? null);
                }
                $entries[] = [
                    'kind'      => $kind,
                    'source_id' => $sourceId,
                    'qty'       => $qty,
                    'positions' => $instancePositions,
                ];
            }
        }

        return $entries;
    }

    /**
     * Positions à écrire dans `positions_jetons` pour la ligne de session créée à partir d'une
     * entrée : seulement les exemplaires dont la position enregistrée n'est pas nulle.
     *
     * @param array<string, mixed> $entry
     * @return array<string, array{x: float, y: float}>
     */
    public static function tokenPositions(string $kind, int $pivotId, array $entry): array
    {
        $qty = $kind === 'pnj' ? 1 : max(1, (int) ($entry['qty'] ?? 1));
        $stored = array_values(is_array($entry['positions'] ?? null) ? $entry['positions'] : []);
        $result = [];

        for ($i = 0; $i < $qty; $i++) {
            $position = self::position($stored[$i] ?? null);
            if ($position === null) {
                continue;
            }
            $key = $kind === 'pnj' ? 'pnj-' . $pivotId : $kind . '-' . $pivotId . '-' . $i;
            $result[$key] = $position;
        }

        return $result;
    }

    /**
     * Positions des seuls héros : ce qui reste de `positions_jetons` quand tous les autres
     * personnages sont retirés de la table.
     *
     * @param array<string, mixed>|null $positions
     * @return array<string, mixed>
     */
    public static function heroPositionsOnly(?array $positions): array
    {
        return array_filter(
            $positions ?? [],
            fn ($key) => str_starts_with((string) $key, 'hero-'),
            ARRAY_FILTER_USE_KEY,
        );
    }

    private static function sourceId(mixed $raw): ?string
    {
        return $raw === null || $raw === '' ? null : (string) $raw;
    }

    /** @return array{x: float, y: float}|null */
    private static function position(mixed $raw): ?array
    {
        if (!is_array($raw) || !is_numeric($raw['x'] ?? null) || !is_numeric($raw['y'] ?? null)) {
            return null;
        }

        return ['x' => (float) $raw['x'], 'y' => (float) $raw['y']];
    }
}
