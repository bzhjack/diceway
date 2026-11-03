<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolArme;
use App\Models\Bol\BolArmure;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionHeros;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScene;

/** Ce que l'accueil lit d'un compte : sa table ouverte, ses scénarios, leur avancement, les héros de sa dernière table et le nombre de
 * fiches de chaque bibliothèque. */
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
                'statut'      => $ouverte->statut,
                'scenario_id' => $ouverte->scenario_id,
                'created_at'  => $ouverte->created_at->toIso8601String(),
            ] : null,
            'scenarios'          => $scenarios->map(fn (BolScenario $scenario) => ['id' => $scenario->id, 'titre' => $scenario->titre])->values()->all(),
            'scenarios_joues'    => $this->scenariosJoues($userId, $sessions->all(), $scenarios->pluck('id')->all(), $ouverte?->id),
            'scenario_recent_id' => $touchee?->scenario_id,
            'derniers_heros'     => $herosIds = ($derniere ? $this->herosDeLaTable($userId, $derniere->id) : []),
            'compagnie'          => $this->compagnie($herosIds),
            'comptes'            => $this->comptes($userId),
        ];
    }

    /**
     * Les héros de la dernière table, dans le même ordre, avec ce qu'il faut pour les montrer.
     *
     * @param array<int, string> $herosIds
     * @return array<int, array{id: string, nom: string, avatar: ?string}>
     */
    private function compagnie(array $herosIds): array
    {
        $heros = BolHeros::whereIn('id', $herosIds)->get(['id', 'nom', 'avatar'])->keyBy('id');

        return array_values(array_filter(array_map(
            fn (string $id) => isset($heros[$id]) ? ['id' => $id, 'nom' => $heros[$id]->nom, 'avatar' => $heros[$id]->avatar] : null,
            $herosIds,
        )));
    }

    /**
     * Le nombre de fiches que chaque bibliothèque montre au compte : ses héros et ses tables ; pour le reste, ses fiches et celles du
     * catalogue.
     *
     * @return array{heros: int, pnjs: int, creatures: int, demons: int, armes: int, armures: int, sessions: int}
     */
    private function comptes(string $userId): array
    {
        return [
            'heros'     => BolHeros::where('user_id', $userId)->where('type', 'H')->count(),
            'pnjs'      => BolHeros::accessibleTo($userId)->where('type', '!=', 'H')->count(),
            'creatures' => BolCreature::accessibleTo($userId)->count(),
            'demons'    => BolDemon::accessibleTo($userId)->count(),
            'armes'     => BolArme::accessibleTo($userId)->count(),
            'armures'   => BolArmure::accessibleTo($userId)->count(),
            'sessions'  => BolFightSession::where('user_id', $userId)->count(),
        ];
    }

    /**
     * Les scénarios joués : ceux dont au moins une scène a été chargée sur une table du compte, ouverte ou terminée, et ceux sur
     * lesquels une autre table que la table ouverte a été posée (un chapitre joué en improvisant, sans charger de scène). La table
     * ouverte, elle, est « sur la table ce soir », pas encore jouée. Une scène sans scénario (« On improvise ») n'en désigne aucun.
     *
     * @param array<int, BolFightSession> $sessions
     * @param array<int, string>          $scenarioIds les scénarios du compte
     * @return array<int, string>
     */
    private function scenariosJoues(string $userId, array $sessions, array $scenarioIds, ?string $ouverteId): array
    {
        $joues = [];
        $sceneIds = [];
        foreach ($sessions as $session) {
            foreach ($session->scenes_jouees ?? [] as $sceneId) {
                $sceneIds[(string) $sceneId] = true;
            }
            if ($session->scenario_id !== null && $session->id !== $ouverteId) {
                $joues[$session->scenario_id] = true;
            }
        }

        if ($sceneIds !== []) {
            $scenarioParScene = BolScene::where('user_id', $userId)->whereNotNull('scenario_id')->pluck('scenario_id', 'id');
            foreach (array_keys($sceneIds) as $sceneId) {
                $scenarioId = $scenarioParScene[$sceneId] ?? null;
                if ($scenarioId !== null) {
                    $joues[$scenarioId] = true;
                }
            }
        }

        return array_values(array_filter(array_keys($joues), fn ($id) => in_array($id, $scenarioIds, true)));
    }

    /**
     * Les héros de la table, dans l'ordre où ils y ont été posés : seulement les héros du compte (pas les PNJ ni le
     * catalogue public, que le seuil ne liste pas) et du camp des héros (pas ceux posés côté adversaires).
     *
     * @return array<int, string>
     */
    private function herosDeLaTable(string $userId, string $sessionId): array
    {
        $heros = BolHeros::where('user_id', $userId)->where('type', 'H')->select('id');

        return BolFightSessionHeros::where('fight_session_id', $sessionId)
            ->where('camp', 'heros')
            ->whereIn('heros_id', $heros)
            ->orderBy('id')
            ->pluck('heros_id')
            ->unique()
            ->values()
            ->all();
    }
}
