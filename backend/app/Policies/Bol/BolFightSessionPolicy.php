<?php

namespace App\Policies\Bol;

use App\Models\Bol\BolFightSession;
use App\Models\User;

class BolFightSessionPolicy
{
    public function view(User $user, BolFightSession $entry): bool
    {
        return (string) $entry->user_id === (string) $user->id;
    }
}
