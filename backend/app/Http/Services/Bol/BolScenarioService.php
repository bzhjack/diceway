<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolScenario;
use Illuminate\Support\Facades\Auth;

class BolScenarioService
{
    public function getScenario(string $id): ?BolScenario
    {
        return BolScenario::where('id', $id)->first();
    }

    public function getScenarios()
    {
        return BolScenario::where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->get();
    }

    public function create(array $input): BolScenario
    {
        return BolScenario::create([
            'user_id' => Auth::id(),
            'titre'   => $input['titre'] ?? null,
            'pitch'   => $input['pitch'] ?? null,
        ]);
    }

    /** Enregistre un scénario du compte ; `null` si ce n'en est pas un. */
    public function update(array $input): ?BolScenario
    {
        $scenario = BolScenario::where('id', $input['id'] ?? null)
            ->where('user_id', Auth::id())
            ->first();
        if (!$scenario) {
            return null;
        }

        $scenario->update([
            'titre' => $input['titre'] ?? null,
            'pitch' => $input['pitch'] ?? null,
        ]);

        return $scenario;
    }

    public function delete(string $id): void
    {
        BolScenario::where('id', $id)->where('user_id', Auth::id())->delete();
    }
}
