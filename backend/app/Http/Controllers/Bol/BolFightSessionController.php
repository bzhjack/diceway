<?php

namespace App\Http\Controllers\Bol;

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
}
