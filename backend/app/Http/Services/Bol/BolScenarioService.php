<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolScenario;
use Illuminate\Support\Facades\Auth;

class BolScenarioService
{
    public function getScenarioWithRelations(string $id): ?BolScenario
    {
        return BolScenario::with($this->relations())->where('id', $id)->first();
    }

    public function getScenariosWithRelations()
    {
        return BolScenario::with($this->relations())
            ->where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->get();
    }

    private function relations(): array
    {
        return [
            'pj.heros',
            'pj.heros.armes.arme',
            'pj.heros.armures.armure',
            'creatures',
            'creatures.creature',
            'demons',
            'demons.demon',
            'pnjs',
            'pnjs.pnj',
        ];
    }
}
