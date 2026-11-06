<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScene;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

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

    /**
     * Supprime un chapitre du compte, ses scènes avec lui, et l'oublie dans le souvenir des parties passées dessus. `false`, sans rien toucher :
     * une partie est dessus, elle redeviendrait improvisée sans que personne l'ait demandé.
     */
    public function supprimer(string $id, string $userId): bool
    {
        return DB::transaction(function () use ($id, $userId) {
            $chapitre = BolScenario::where('id', $id)->where('user_id', $userId)->lockForUpdate()->first();
            if (!$chapitre) {
                return true;
            }
            if (BolFightSession::where('scenario_id', $id)->exists()) {
                return false;
            }
            BolScene::where('scenario_id', $id)->where('user_id', $userId)->get()->each->delete();
            BolFightSession::where('user_id', $userId)->whereNotNull('chapitres_quittes')->get()->each(function (BolFightSession $partie) use ($id): void {
                if (in_array($id, $partie->chapitres_quittes, true)) {
                    $partie->update(['chapitres_quittes' => array_values(array_diff($partie->chapitres_quittes, [$id]))]);
                }
            });
            $chapitre->delete();

            return true;
        });
    }
}
