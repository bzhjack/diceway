<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolSagaService;
use App\Http\Services\Bol\BolScenarioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/** Les scénarios du compte (`BolSaga`), depuis la bibliothèque : les lister (ceux sans chapitre compris), en créer un par son seul nom,
 * les renommer, les supprimer d'un bloc. Un chapitre créé avec un titre « Scénario — 1. Nom » retrouve ou crée aussi le sien. */
class BolSagaController extends Controller
{
    public function __construct(
        private readonly BolSagaService $sagaService,
        private readonly BolScenarioService $scenarioService,
    ) {}

    public function getAll()
    {
        return response()->json($this->sagaService->duCompte((string) Auth::id()));
    }

    public function create(Request $request)
    {
        $data = $request->validate(['titre' => 'required|string|max:150']);
        $saga = $this->sagaService->creer((string) Auth::id(), str_replace('—', '-', trim($data['titre'])));
        if ($saga === false) {
            return $this->homonyme();
        }

        return response()->json($saga->only(['id', 'titre']));
    }

    public function update(Request $request, string $id)
    {
        $data = $request->validate(['titre' => 'required|string|max:150']);
        $saga = $this->sagaService->renommer($id, (string) Auth::id(), trim($data['titre']));
        if ($saga === null) {
            return response()->json(['error' => 'Not found'], 404);
        }
        if ($saga === false) {
            return $this->homonyme();
        }

        return response()->json($saga);
    }

    private function homonyme()
    {
        return response()->json(['message' => 'Un autre scénario porte déjà ce nom.', 'errors' => ['titre' => ['Un autre scénario porte déjà ce nom.']]], 422);
    }

    public function delete(string $id)
    {
        if (!$this->scenarioService->supprimerScenario($id, (string) Auth::id())) {
            return response()->json(['message' => 'Une partie joue un chapitre de ce scénario : changez-la de chapitre ou supprimez-la d’abord.'], 409);
        }

        return response()->json(true);
    }
}
