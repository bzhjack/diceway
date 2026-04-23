<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolScenarioService;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScenarioPj;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BolScenarioController extends Controller
{
    public function __construct(private readonly BolScenarioService $scenarioService) {}

    public function getAll()
    {
        return response()->json($this->scenarioService->getScenariosWithRelations());
    }

    public function getOne(string $id)
    {
        $scenario = $this->scenarioService->getScenarioWithRelations($id);
        if (!$scenario) {
            return response()->json(['error' => 'Not found'], 404);
        }
        return response()->json($scenario);
    }

    public function create(Request $request)
    {
        $scenario = BolScenario::create([
            'user_id' => Auth::id(),
            'titre'   => $request->titre,
            'pitch'   => $request->pitch,
        ]);

        $this->syncPj($scenario->id, $request->pj ?? []);

        return response()->json($this->scenarioService->getScenarioWithRelations($scenario->id));
    }

    public function update(Request $request)
    {
        $scenario = BolScenario::where('id', $request->id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$scenario) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $scenario->update([
            'titre' => $request->titre,
            'pitch' => $request->pitch,
        ]);

        $this->syncPj($scenario->id, $request->pj ?? []);

        return response()->json($this->scenarioService->getScenarioWithRelations($scenario->id));
    }

    public function delete(string $id)
    {
        BolScenario::where('id', $id)->where('user_id', Auth::id())->delete();
        return response()->json(true);
    }

    private function syncPj(string $scenarioId, array $pjList): void
    {
        BolScenarioPj::where('scenario_id', $scenarioId)->delete();
        foreach ($pjList as $pj) {
            BolScenarioPj::create([
                'scenario_id' => $scenarioId,
                'heros_id'    => $pj['heroId'],
            ]);
        }
    }
}
