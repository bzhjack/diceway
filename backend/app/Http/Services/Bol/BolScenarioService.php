<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolScenario;
use Illuminate\Support\Facades\Auth;

/** Les chapitres du compte (`BolScenario`), chacun avec son scénario (`saga` : son id et son nom ; null pour un one shot). */
class BolScenarioService
{
    public function __construct(private readonly BolSagaService $sagaService) {}

    public function getScenario(string $id): ?BolScenario
    {
        return BolScenario::with('saga:id,titre')->where('id', $id)->first();
    }

    public function getScenarios()
    {
        return BolScenario::with('saga:id,titre')
            ->where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->get();
    }

    /** Crée un chapitre : son titre d'un seul tenant (« Scénario — 1. Nom ») le range dans son scénario, retrouvé ou créé ; sans tiret
     * cadratin, c'est un one shot. */
    public function create(array $input): BolScenario
    {
        $userId = (string) Auth::id();
        $chapitre = BolScenario::create(
            $this->sagaService->champsDuChapitre($userId, (string) ($input['titre'] ?? '')) + ['user_id' => $userId, 'pitch' => $input['pitch'] ?? null],
        );

        return $chapitre->load('saga:id,titre');
    }

    /** Enregistre un chapitre du compte, rangé d'après son titre comme à la création ; `null` si ce n'en est pas un. */
    public function update(array $input): ?BolScenario
    {
        $userId = (string) Auth::id();
        $scenario = BolScenario::where('id', $input['id'] ?? null)
            ->where('user_id', $userId)
            ->first();
        if (!$scenario) {
            return null;
        }

        $scenario->update(
            $this->sagaService->champsDuChapitre($userId, (string) ($input['titre'] ?? '')) + ['pitch' => $input['pitch'] ?? null],
        );

        return $scenario->load('saga:id,titre');
    }

    public function delete(string $id): void
    {
        BolScenario::where('id', $id)->where('user_id', Auth::id())->delete();
    }
}
