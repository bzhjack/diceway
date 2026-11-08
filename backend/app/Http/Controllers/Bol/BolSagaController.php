<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolSagaService;
use App\Http\Services\Bol\BolScenarioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/** Les scénarios du compte (`BolSaga`), depuis la bibliothèque : les renommer, les supprimer d'un bloc. Ils se créent avec leur premier
 * chapitre (`POST /bol/scenario/create`, titre « Scénario — 1. Nom »). */
class BolSagaController extends Controller
{
    public function __construct(
        private readonly BolSagaService $sagaService,
        private readonly BolScenarioService $scenarioService,
    ) {}

    public function update(Request $request, string $id)
    {
        $data = $request->validate(['titre' => 'required|string|max:150']);
        $saga = $this->sagaService->renommer($id, (string) Auth::id(), trim($data['titre']));
        if ($saga === null) {
            return response()->json(['error' => 'Not found'], 404);
        }
        if ($saga === false) {
            return response()->json(['message' => 'Un autre scénario porte déjà ce nom.', 'errors' => ['titre' => ['Un autre scénario porte déjà ce nom.']]], 422);
        }

        return response()->json($saga);
    }

    public function delete(string $id)
    {
        if (!$this->scenarioService->supprimerScenario($id, (string) Auth::id())) {
            return response()->json(['message' => 'Une partie joue un chapitre de ce scénario : changez-la de chapitre ou supprimez-la d’abord.'], 409);
        }

        return response()->json(true);
    }
}
