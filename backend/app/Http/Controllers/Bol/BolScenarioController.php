<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolScenarioService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class BolScenarioController extends Controller
{
    public function __construct(private readonly BolScenarioService $scenarioService) {}

    public function getAll()
    {
        return response()->json($this->scenarioService->getScenarios());
    }

    public function getOne(string $id)
    {
        $scenario = $this->scenarioService->getScenario($id);
        if (!$scenario || Gate::denies('view', $scenario)) {
            return response()->json(['error' => 'Not found'], 404);
        }
        return response()->json($scenario);
    }

    public function create(Request $request)
    {
        return response()->json($this->scenarioService->create($request->all()));
    }

    public function update(Request $request)
    {
        $scenario = $this->scenarioService->update($request->all());
        if (!$scenario) {
            return response()->json(['error' => 'Not found'], 404);
        }
        return response()->json($scenario);
    }

    public function delete(string $id)
    {
        if (!$this->scenarioService->supprimer($id, (string) Auth::id())) {
            return response()->json(['message' => 'Une partie joue ce chapitre : changez-la de chapitre ou supprimez-la d’abord.'], 409);
        }

        return response()->json(true);
    }
}
