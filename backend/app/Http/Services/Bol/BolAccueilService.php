<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionHeros;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScene;

/** Ce que l'accueil lit d'un compte : sa table ouverte, ses scénarios, leur avancement et les héros de sa dernière table. */
class BolAccueilService
{
    /** Statuts d'une table encore ouverte : une table au statut `terminee` n'en est plus une. */
    private const OUVERTES = ['libre', 'combat'];

    public function summary(string $userId): array
    {
        $sessions = BolFightSession::where('user_id', $userId)
            ->get(['id', 'titre', 'statut', 'scenario_id', 'scenes_jouees', 'created_at', 'updated_at']);
        $scenarios = BolScenario::where('user_id', $userId)->get(['id', 'titre']);

        $ouverte = $sessions->whereIn('statut', self::OUVERTES)->sortByDesc('created_at')->first();
        $derniere = $sessions->sortByDesc('created_at')->first();
        $touchee = $sessions->whereNotNull('scenario_id')->sortByDesc('updated_at')->first();

        return [
            'table' => $ouverte ? [
                'id'          => $ouverte->id,
                'titre'       => $ouverte->titre,
                'scenario_id' => $ouverte->scenario_id,
                'created_at'  => $ouverte->created_at->toIso8601String(),
            ] : null,
            'scenarios'          => $scenarios->map(fn (BolScenario $scenario) => ['id' => $scenario->id, 'titre' => $scenario->titre])->values()->all(),
            'scenarios_joues'    => $this->scenariosJoues($userId, $sessions->all(), $scenarios->pluck('id')->all()),
            'scenario_recent_id' => $touchee?->scenario_id,
            'derniers_heros'     => $derniere ? $this->herosDeLaTable($userId, $derniere->id) : [],
        ];
    }

    /**
     * Les scénarios dont au moins une scène a été chargée sur une table du compte, ouverte ou terminée.
     * Une scène sans scénario (« On improvise ») n'en désigne aucun.
     *
     * @param array<int, BolFightSession> $sessions
     * @param array<int, string>          $scenarioIds les scénarios du compte
     * @return array<int, string>
     */
    private function scenariosJoues(string $userId, array $sessions, array $scenarioIds): array
    {
        $sceneIds = [];
        foreach ($sessions as $session) {
            foreach ($session->scenes_jouees ?? [] as $sceneId) {
                $sceneIds[(string) $sceneId] = true;
            }
        }
        if ($sceneIds === []) {
            return [];
        }

        $scenarioParScene = BolScene::where('user_id', $userId)->whereNotNull('scenario_id')->pluck('scenario_id', 'id');
        $joues = [];
        foreach (array_keys($sceneIds) as $sceneId) {
            $scenarioId = $scenarioParScene[$sceneId] ?? null;
            if ($scenarioId !== null && in_array($scenarioId, $scenarioIds, true)) {
                $joues[$scenarioId] = true;
            }
        }

        return array_keys($joues);
    }

    /**
     * Les héros (pas les PNJ) de la table, dans l'ordre où ils y ont été posés, parmi ceux que le compte peut utiliser.
     *
     * @return array<int, string>
     */
    private function herosDeLaTable(string $userId, string $sessionId): array
    {
        $heros = BolHeros::accessibleTo($userId)->where('type', 'H')->select('id');

        return BolFightSessionHeros::where('fight_session_id', $sessionId)
            ->whereIn('heros_id', $heros)
            ->orderBy('id')
            ->pluck('heros_id')
            ->unique()
            ->values()
            ->all();
    }
}
