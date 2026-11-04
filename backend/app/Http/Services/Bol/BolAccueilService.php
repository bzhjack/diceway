<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolArme;
use App\Models\Bol\BolArmure;
use App\Models\Bol\BolCompagnie;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionHeros;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScene;

/** Ce que l'accueil lit d'un compte : ses parties (la dernière jouée en tête, chacune avec où en est son chapitre, les chapitres qu'elle a
 * joués et ses héros), ses scénarios et le nombre de fiches de chaque bibliothèque. */
class BolAccueilService
{
    public function __construct(private readonly BolCompagnieService $compagnieService) {}

    public function summary(string $userId): array
    {
        $adversaires = fn ($lignes) => $lignes->where('camp', '!=', 'heros');
        $sessions = BolFightSession::where('user_id', $userId)
            ->withCount(['pnjs as figurants_pnj' => $adversaires, 'creatures as figurants_creature' => $adversaires, 'demons as figurants_demon' => $adversaires])
            ->orderByDesc('jouee_le')
            ->orderByDesc('created_at')
            ->get(['id', 'compagnie_id', 'titre', 'statut', 'scenario_id', 'scene_id', 'scenes_jouees', 'chapitres_quittes', 'jouee_le', 'created_at']);
        $scenarios = BolScenario::with('saga:id,titre')->where('user_id', $userId)->get(['id', 'saga_id', 'numero', 'titre']);
        $scenesParChapitre = BolScene::where('user_id', $userId)->whereNotNull('scenario_id')->get(['id', 'scenario_id'])
            ->groupBy('scenario_id')
            ->map(fn ($scenes) => $scenes->pluck('id')->map(fn ($id) => (string) $id)->all());
        $chapitresDuCompte = $scenarios->pluck('id')->all();

        return [
            'derniere'  => $sessions->first()?->id,
            'parties'   => $sessions->map(fn (BolFightSession $partie) => $this->partie($userId, $partie, $scenesParChapitre->all(), $chapitresDuCompte))
                ->values()->all(),
            'compagnies' => $this->compagnieService->liste($userId),
            'scenarios' => $scenarios->map(fn (BolScenario $scenario) => [
                'id'     => $scenario->id,
                'titre'  => $scenario->titre,
                'numero' => $scenario->numero,
                'saga'   => $scenario->saga ? ['id' => $scenario->saga->id, 'titre' => $scenario->saga->titre] : null,
            ])->values()->all(),
            'comptes'   => $this->comptes($userId),
        ];
    }

    /**
     * Une partie pour l'accueil : où en est son chapitre (ses scènes, celles passées sur cette table), les chapitres qu'elle a joués, et
     * ses héros.
     *
     * @param array<string, array<int, string>> $scenesParChapitre
     * @param array<int, string>                $chapitresDuCompte
     * @return array<string, mixed>
     */
    private function partie(string $userId, BolFightSession $partie, array $scenesParChapitre, array $chapitresDuCompte): array
    {
        $scenes = $this->scenesDuScenario($userId, $partie->scenario_id);

        return [
            'id'              => $partie->id,
            'compagnie_id'    => $partie->compagnie_id,
            'titre'           => $partie->titre,
            'statut'          => $partie->statut,
            'jouee_le'        => $partie->jouee_le?->toIso8601String(),
            'scenario_id'     => $partie->scenario_id,
            'scene_id'        => $partie->scene_id,
            'scenes'          => $scenes,
            'scenes_jouees'   => array_values(array_intersect(array_map('strval', $partie->scenes_jouees ?? []), array_column($scenes, 'id'))),
            'chapitres_joues' => $this->chapitresJoues($partie, $scenesParChapitre, $chapitresDuCompte),
            'heros'           => $this->compagnie($this->herosDeLaTable($userId, $partie->id)),
            // Ce qu'un changement de chapitre retirerait : les héros et leurs alliés restent.
            'figurants'       => $partie->figurants_pnj + $partie->figurants_creature + $partie->figurants_demon,
        ];
    }

    /**
     * Les chapitres joués par cette partie : ceux qu'elle a quittés pour un autre chapitre, et ceux dont toutes les scènes (au moins une)
     * sont passées sur cette table, la scène en cours n'y comptant pas : on y est encore. Ce que jouent les autres parties n'y compte pas.
     *
     * @param array<string, array<int, string>> $scenesParChapitre
     * @param array<int, string>                $chapitresDuCompte
     * @return array<int, string>
     */
    private function chapitresJoues(BolFightSession $partie, array $scenesParChapitre, array $chapitresDuCompte): array
    {
        $jouees = array_diff(array_map('strval', $partie->scenes_jouees ?? []), [(string) $partie->scene_id]);
        $joues = array_map('strval', $partie->chapitres_quittes ?? []);
        foreach ($scenesParChapitre as $chapitre => $scenes) {
            if ($scenes !== [] && array_diff($scenes, $jouees) === []) {
                $joues[] = (string) $chapitre;
            }
        }

        return array_values(array_intersect($chapitresDuCompte, array_unique($joues)));
    }

    /**
     * Les scènes du chapitre d'une partie, dans leur ordre : de quoi dire où en est le chapitre. Aucune sans chapitre.
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
            'compagnies' => BolCompagnie::where('user_id', $userId)->count(),
        ];
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
