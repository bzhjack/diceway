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

/** Ce que l'accueil lit d'un compte : sa table ouverte (et où en est son chapitre), ses scénarios, leur avancement, les héros à table et
 * le nombre de fiches de chaque bibliothèque. */
class BolAccueilService
{
    /** Statuts d'une table encore ouverte : une table au statut `terminee` n'en est plus une. */
    private const OUVERTES = ['libre', 'combat'];

    public function summary(string $userId): array
    {
        $sessions = BolFightSession::where('user_id', $userId)
            ->get(['id', 'titre', 'statut', 'scenario_id', 'scene_id', 'scenes_jouees', 'chapitres_quittes', 'created_at', 'updated_at']);
        $scenarios = BolScenario::with('saga:id,titre')->where('user_id', $userId)->get(['id', 'saga_id', 'numero', 'titre']);

        // La table ouverte la plus récemment active (pas la plus récemment créée) : une table rouverte (`reopenSession` la touche)
        // revient au bandeau ; une table close, elle, n'est plus ouverte, si récente que soit sa clôture.
        $ouverte = $sessions->whereIn('statut', self::OUVERTES)->sortByDesc('updated_at')->first();
        $derniere = $sessions->sortByDesc('created_at')->first();
        $touchee = $sessions->whereNotNull('scenario_id')->sortByDesc('updated_at')->first();
        // La compagnie est celle qui est à table : la table ouverte, sinon la dernière ouverte.
        $aTable = $ouverte ?? $derniere;

        return [
            'table' => $ouverte ? [
                'id'            => $ouverte->id,
                'titre'         => $ouverte->titre,
                'statut'        => $ouverte->statut,
                'scenario_id'   => $ouverte->scenario_id,
                'scene_id'      => $ouverte->scene_id,
                'scenes'        => $scenes = $this->scenesDuScenario($userId, $ouverte->scenario_id),
                'scenes_jouees' => array_values(array_intersect(
                    array_map('strval', $ouverte->scenes_jouees ?? []),
                    array_column($scenes, 'id'),
                )),
                'created_at'    => $ouverte->created_at->toIso8601String(),
            ] : null,
            'scenarios'          => $scenarios->map(fn (BolScenario $scenario) => [
                'id'     => $scenario->id,
                'titre'  => $scenario->titre,
                'numero' => $scenario->numero,
                'saga'   => $scenario->saga ? ['id' => $scenario->saga->id, 'titre' => $scenario->saga->titre] : null,
            ])->values()->all(),
            'scenarios_joues'    => $this->scenariosJoues($userId, $sessions->all(), $scenarios->pluck('id')->all()),
            'scenario_recent_id' => $touchee?->scenario_id,
            'compagnie'          => $this->compagnie($aTable ? $this->herosDeLaTable($userId, $aTable->id) : []),
            'comptes'            => $this->comptes($userId),
        ];
    }

    /**
     * Les scènes du scénario de la table ouverte, dans leur ordre : de quoi dire où en est le chapitre. Aucune sans scénario.
     *
     * @return array<int, array{id: string, titre: string}>
     */
    private function scenesDuScenario(string $userId, ?string $scenarioId): array
    {
        if ($scenarioId === null) {
            return [];
        }

        return BolScene::where('user_id', $userId)
            ->where('scenario_id', $scenarioId)
            ->orderBy('ordre')
            ->get(['id', 'titre', 'lieu'])
            ->map(fn (BolScene $scene) => ['id' => (string) $scene->id, 'titre' => $scene->titre ?: ($scene->lieu ?: 'Scène sans titre')])
            ->values()
            ->all();
    }

    /**
     * Les héros d'une table, dans le même ordre, avec ce qu'il faut pour les montrer.
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
     * Les chapitres joués : ceux qu'une table du compte a quittés pour un autre chapitre (elle les a finis), et ceux dont toutes les scènes
     * ont été chargées sur les tables du compte. Clore une table ne compte pas : un MJ qui mène plusieurs compagnies en clôt une pour en
     * reprendre une autre, en plein chapitre. Une scène sans scénario (« On improvise ») n'en désigne aucun.
     *
     * @param array<int, BolFightSession> $sessions
     * @param array<int, string>          $scenarioIds les scénarios du compte
     * @return array<int, string>
     */
    private function scenariosJoues(string $userId, array $sessions, array $scenarioIds): array
    {
        $joues = [];
        $scenesJouees = [];
        foreach ($sessions as $session) {
            foreach ($session->chapitres_quittes ?? [] as $scenarioId) {
                $joues[(string) $scenarioId] = true;
            }
            foreach ($session->scenes_jouees ?? [] as $sceneId) {
                $scenesJouees[(string) $sceneId] = true;
            }
        }

        if ($scenesJouees !== []) {
            $scenesParScenario = BolScene::where('user_id', $userId)->whereNotNull('scenario_id')->get(['id', 'scenario_id'])->groupBy('scenario_id');
            foreach ($scenesParScenario as $scenarioId => $scenes) {
                if ($scenes->every(fn (BolScene $scene) => isset($scenesJouees[(string) $scene->id]))) {
                    $joues[(string) $scenarioId] = true;
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
