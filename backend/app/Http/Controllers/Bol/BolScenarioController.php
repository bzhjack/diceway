<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolScenarioService;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolScenarioCreature;
use App\Models\Bol\BolScenarioDemon;
use App\Models\Bol\BolScenarioPj;
use App\Models\Bol\BolScenarioPnj;
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
        $this->syncCreatures($scenario->id, $request->creatures ?? []);
        $this->syncDemons($scenario->id, $request->demons ?? []);
        $this->syncPnjs($scenario->id, $request->pnjs ?? []);

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
        $this->syncCreatures($scenario->id, $request->creatures ?? []);
        $this->syncDemons($scenario->id, $request->demons ?? []);
        $this->syncPnjs($scenario->id, $request->pnjs ?? []);

        return response()->json($this->scenarioService->getScenarioWithRelations($scenario->id));
    }

    public function delete(string $id)
    {
        BolScenario::where('id', $id)->where('user_id', Auth::id())->delete();
        return response()->json(true);
    }

    private function syncCreatures(string $scenarioId, array $creatureList): void
    {
        BolScenarioCreature::where('scenario_id', $scenarioId)->delete();
        foreach ($creatureList as $item) {
            $creature = BolCreature::find($item['creatureId']);
            if (!$creature) {
                continue;
            }
            BolScenarioCreature::create([
                'scenario_id'       => $scenarioId,
                'creature_id'       => $creature->id,
                'surnom'            => $item['surnom'] ?? null,
                'nom'               => $creature->nom,
                'vigueur'           => $creature->vigueur,
                'agilite'           => $creature->agilite,
                'esprit'            => $creature->esprit,
                'vitalite_max'      => $creature->vitalite,
                'vitalite_courante' => $creature->vitalite,
                'attaque'           => $creature->attaque,
                'defense'           => $creature->defense,
                'degats'            => $creature->degats,
                'protection'        => $creature->protection,
                'id_taille'         => $creature->id_taille,
            ]);
        }
    }

    private function syncDemons(string $scenarioId, array $demonList): void
    {
        BolScenarioDemon::where('scenario_id', $scenarioId)->delete();
        foreach ($demonList as $item) {
            $demon = BolDemon::find($item['demonId']);
            if (!$demon) {
                continue;
            }
            BolScenarioDemon::create([
                'scenario_id'       => $scenarioId,
                'demon_id'          => $demon->id,
                'surnom'            => $item['surnom'] ?? null,
                'nom'               => $demon->nom,
                'vigueur'           => $demon->vigueur,
                'agilite'           => $demon->agilite,
                'esprit'            => $demon->esprit,
                'aura'              => $demon->aura,
                'melee'             => $demon->melee,
                'tir'               => $demon->tir,
                'defense'           => $demon->defense,
                'vitalite_max'      => $demon->vitalite,
                'vitalite_courante' => $demon->vitalite,
                'degats'            => $demon->degats,
                'id_taille'         => $demon->id_taille,
            ]);
        }
    }

    private function syncPnjs(string $scenarioId, array $pnjList): void
    {
        BolScenarioPnj::where('scenario_id', $scenarioId)->delete();
        foreach ($pnjList as $item) {
            $pnj = BolHeros::find($item['pnjId']);
            if (!$pnj) {
                continue;
            }
            $pnjWithArmes = BolHeros::with('armes.arme')->find($pnj->id);
            $armes = collect($pnjWithArmes->armes ?? [])->map(fn($ha) => [
                'nom'    => $ha->arme?->arme,
                'degats' => $ha->arme?->degats,
                'type'   => $ha->arme?->type,
            ])->values()->toArray();

            BolScenarioPnj::create([
                'scenario_id'       => $scenarioId,
                'pnj_id'            => $pnj->id,
                'surnom'            => $item['surnom'] ?? null,
                'nom'               => $pnj->nom,
                'vigueur'           => $pnj->vigueur,
                'agilite'           => $pnj->agilite,
                'esprit'            => $pnj->esprit,
                'aura'              => $pnj->aura,
                'melee'             => $pnj->melee,
                'tir'               => $pnj->tir,
                'defense'           => $pnj->defense,
                'vitalite_max'      => $pnj->vitalite,
                'vitalite_courante' => $pnj->vitalite,
                'armes'             => $armes,
            ]);
        }
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
