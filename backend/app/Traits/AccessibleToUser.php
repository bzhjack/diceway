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
}
