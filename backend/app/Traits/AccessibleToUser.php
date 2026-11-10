<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait AccessibleToUser
{
    /** Ce qu'un compte peut utiliser : ses fiches et celles du catalogue (sans propriétaire). */
    public function scopeAccessibleTo(Builder $query, string $userId): Builder
    {
        return $query->where(fn (Builder $accessible) => $accessible->where('user_id', $userId)->orWhereNull('user_id'));
    }

    /**
     * Parmi ces identifiants envoyés par le client, ceux des fiches que ce compte peut utiliser, en chaînes. `$restreindre` resserre la
     * recherche (les PNJ parmi les `BolHeros`, par exemple).
     *
     * @param array<int, mixed>          $ids
     * @param (\Closure(Builder): mixed)|null $restreindre
     * @return array<int, string>
     */
    public static function idsAccessibles(string $userId, array $ids, ?\Closure $restreindre = null): array
    {
        $ids = array_values(array_unique(array_map('strval', $ids)));
        if ($ids === []) {
            return [];
        }
        $query = static::accessibleTo($userId)->whereIn('id', $ids);
        if ($restreindre !== null) {
            $restreindre($query);
        }

        return $query->pluck('id')->map(fn ($id) => (string) $id)->all();
    }
}
