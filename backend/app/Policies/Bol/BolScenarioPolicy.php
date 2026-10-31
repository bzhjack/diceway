<?php

namespace App\Policies\Bol;

use App\Models\Bol\BolScenario;
use App\Models\User;

class BolScenarioPolicy
{
    public function view(User $user, BolScenario $entry): bool
    {
        return (string) $entry->user_id === (string) $user->id;
    }
}
