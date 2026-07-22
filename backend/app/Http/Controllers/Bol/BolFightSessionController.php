<?php

namespace App\Http\Controllers\Bol;

use App\Exceptions\Bol\DuplicateCombatantException;
use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolFightSessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BolFightSessionController extends Controller
{
    public function __construct(private readonly BolFightSessionService $fightSessionService) {}

    public function getAll()
    {
        return response()->json($this->fightSessionService->getSessionsWithRelations(Auth::id()));
    }

    public function getOne(string $id)
    {
        $session = $this->fightSessionService->getSessionWithRelations($id);
        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }
        return response()->json($session);
    }

    public function create(Request $request)
    {
        $session = $this->fightSessionService->createSession(Auth::id(), [
            'titre'     => $request->titre,
            'heros'     => $request->heros ?? [],
            'creatures' => $request->creatures ?? [],
            'demons'    => $request->demons ?? [],
            'pnjs'      => $request->pnjs ?? [],
        ]);

        return response()->json($session);
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

    public function applyDamage(Request $request, string $id, string $kind, int $pivotId)
    {
        $session = $this->fightSessionService->applyDamage(
            $id,
            Auth::id(),
            $kind,
            $pivotId,
            (int) $request->input('delta'),
        );

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
    }

    public function updateOrder(Request $request, string $id)
    {
        $session = $this->fightSessionService->updateOrder($id, Auth::id(), $request->input('ordre', []));

        if (!$session) {
            return response()->json(['error' => 'Not found'], 404);
        }

        return response()->json($session);
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
}
