<?php

namespace App\Policies\Bol;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/** Une fiche du catalogue (sans propriétaire) se lit par tous et ne se modifie par personne ; une fiche d'un compte n'existe que pour lui. */
abstract class CatalogEntryPolicy
{
    public function view(User $user, Model $entry): bool
    {
        return $entry->user_id === null || (string) $entry->user_id === (string) $user->id;
    }

    public function update(User $user, Model $entry): bool
    {
        return (string) $entry->user_id === (string) $user->id;
    }

    public function delete(User $user, Model $entry): bool
    {
        return $this->update($user, $entry);
    }
}
