<?php

namespace App\Http\Controllers\Bol;

use App\Exceptions\Bol\CombatWithoutAdversaryException;
use App\Exceptions\Bol\DuplicateCombatantException;
use App\Exceptions\Bol\FuiteImpossibleException;
use App\Exceptions\Bol\SceneLoadNotAllowedException;
use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolCompagnieService;
use App\Http\Services\Bol\BolFightSessionService;
use App\Http\Services\Bol\BolSceneService;
use App\Http\Services\Bol\BolSceneDistribution;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class BolFightSessionController extends Controller
{
    public function __construct(
        private readonly BolFightSessionService $fightSessionService,
        private readonly BolCompagnieService $compagnieService,
        private readonly BolSceneService $sceneService,
    ) {}

    public function getAll()
    {
        return response()->json($this->fightSessionService->getSessionSummaries(Auth::id()));
    }

    public function getOne(string $id)
    {
        $session = $this->fightSessionService->getSessionWithRelations($id);
        if (!$session || Gate::denies('view', $session)) {
            return response()->json(['error' => 'Not found'], 404);
        }
        return response()->json($session);
    }

    public function create(Request $request)
    {
        // Une partie prend le nom et les héros de sa compagnie ; une table sans compagnie (les scripts de test) se crée toujours nommée.
        if ($request->filled('compagnie_id')) {
            return $this->creerPartie($request);
        }
        $request->validate(['titre' => 'required|string|max:255']);

        $session = $this->fightSessionService->createSession(Auth::id(), [
            'titre'       => $request->titre,
            'scenario_id' => $request->scenario_id,
            'heros'       => $request->heros ?? [],
            'creatures'   => $request->creatures ?? [],
            'demons'      => $request->demons ?? [],
            'pnjs'        => $request->pnjs ?? [],
        ]);

        return response()->json($session);
    }

    private function creerPartie(Request $request)
    {
        $compagnie = $this->compagnieService->trouver((string) $request->input('compagnie_id'), Auth::id());
        if (!$compagnie) {
            return response()->json(['error' => 'Not found'], 404);
        }
        ['partie' => $partie, 'existante' => $existante] = $this->fightSessionService->creerPartie(Auth::id(), $compagnie, $request->input('scenario_id'));
        if ($existante) {
            return response()->json(['error' => 'Cette compagnie joue déjà ce scénario.', 'partie_id' => $partie->id], 422);
        }

        return response()->json($this->sceneService->chargerLaPremiereScene(Auth::id(), $partie));
    }

    public function delete(string $id)
    {
        $this->fightSessionService->deleteSession($id, Auth::id());
        return response()->json(true);
    }

    public function addCombatant(Request $request, string $id)
    {
        try {
            $session = $this->fightSessionService->addCombatant(
                $id,
                Auth::id(),
                (string) $request->input('kind'),
                (string) $request->input('sourceId'),
                (string) $request->input('camp'),
                (int) ($request->input('qty') ?? 1),
            );
        } catch (DuplicateCombatantException) {
            return response()->json(['error' => 'Ce combattant participe déjà à ce combat.'], 422);
        }

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }

    public function removeCombatant(string $id, string $kind, int $pivotId)
    {
        $session = $this->fightSessionService->removeCombatant($id, Auth::id(), $kind, $pivotId);

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }

    public function setCamp(Request $request, string $id, string $kind, int $pivotId)
    {
        $data = $request->validate(['camp' => 'required|in:heros,adversaires']);

        if ($kind === 'hero') {
            return response()->json(['error' => 'Un héros reste dans le camp des héros.'], 422);
        }

        $session = $this->fightSessionService->setCamp($id, Auth::id(), $kind, $pivotId, $data['camp']);

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }

    public function setAttitude(Request $request, string $id, string $kind, int $pivotId)
    {
        $data = $request->validate(['attitude' => ['present', 'nullable', Rule::in(BolSceneDistribution::ATTITUDES)]]);

        $session = $this->fightSessionService->setAttitude($id, Auth::id(), $kind, $pivotId, $data['attitude']);

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }

    public function adjustVilenie(Request $request, string $id, int $pivotId)
    {
        $data = $request->validate(['delta' => 'required|integer|between:-10,10']);

        $session = $this->fightSessionService->adjustVilenie($id, Auth::id(), $pivotId, $data['delta']);

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }

    /** « Fuite opportune » : le rival adverse dépense 1 point de vilénie et quitte le combat, les deux en une seule fois. */
    public function fuiteOpportune(string $id, int $pivotId)
    {
        try {
            $session = $this->fightSessionService->fuiteOpportune($id, Auth::id(), $pivotId);
        } catch (FuiteImpossibleException $e) {
            return response()->json(['error' => $e->getMessage()], 422);
        }

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }

    /** Points de foi ou de pouvoir d'un PNJ de la table dépensés (ou rendus) : un dé de foi, un sort. */
    public function adjustPnjRessource(Request $request, string $id, int $pivotId)
    {
        $data = $request->validate(['ressource' => 'required|in:foi,pouvoir', 'delta' => 'required|integer|between:-30,30']);

        $session = $this->fightSessionService->adjustPnjRessource($id, Auth::id(), $pivotId, $data['ressource'], $data['delta']);

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }

    public function applyDamage(Request $request, string $id, string $kind, int $pivotId)
    {
        $instanceIndex = $request->input('instanceIndex');

        $session = $this->fightSessionService->applyDamage(
            $id,
            Auth::id(),
            $kind,
            $pivotId,
            (int) $request->input('delta'),
            $instanceIndex === null ? null : (int) $instanceIndex,
        );

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }

    public function startCombat(Request $request, string $id)
    {
        $data = $request->validate(['exclus' => 'sometimes|array', 'exclus.*' => 'string']);

        try {
            $session = $this->fightSessionService->startCombat($id, Auth::id(), $data['exclus'] ?? []);
        } catch (CombatWithoutAdversaryException) {
            return response()->json(['error' => 'Aucun adversaire : ajoutes-en un pour pouvoir démarrer le combat.'], 422);
        }

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }

    public function endCombat(string $id)
    {
        $session = $this->fightSessionService->endCombat($id, Auth::id());

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }

    public function changerChapitre(Request $request, string $id)
    {
        try {
            $session = $this->sceneService->changerDeChapitre($id, Auth::id(), $request->input('scenario_id'));
        } catch (SceneLoadNotAllowedException) {
            return response()->json(['error' => 'Terminez le combat avant de changer de chapitre.'], 409);
        }

        if ($session === null) {
            return response()->json(['error' => 'Not found'], 404);
        }
        if ($session === false) {
            return response()->json(['error' => 'Ce chapitre n’est pas du scénario de la partie.'], 422);
        }

        return response()->json($session);
    }

    public function jouer(string $id)
    {
        $session = $this->fightSessionService->jouer($id, Auth::id());

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($this->sceneService->chargerLaPremiereScene(Auth::id(), $session));
    }

    public function updateHeroInitiative(Request $request, string $id, int $herosPivotId)
    {
        $pivot = $this->fightSessionService->updateHeroInitiative(
            $id,
            $herosPivotId,
            Auth::id(),
            $request->input('resultat'),
        );

        if (!$pivot) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($pivot);
    }

    public function updateCombatState(Request $request, string $id)
    {
        $data = $request->validate([
            'round'            => 'required|integer|min:1',
            'joues'            => 'present|array',
            'joues.*'          => 'string',
            'effets'           => 'sometimes|array',
            'effets.*'         => 'array',
            'exclus'           => 'sometimes|array',
            'exclus.*'         => 'string',
            'fuis'             => 'sometimes|array',
            'fuis.*'           => 'string',
            'melee'            => 'sometimes|nullable|integer|min:1',
        ]);

        $session = $this->fightSessionService->updateCombatState($id, Auth::id(), $data);

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }
}
