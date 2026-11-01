<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolCreature;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolPouvoir;
use App\Models\Bol\BolScenario;
use App\Models\Bol\BolScenarioCreature;
use App\Models\Bol\BolScenarioDemon;
use App\Models\Bol\BolScenarioPj;
use App\Models\Bol\BolScenarioPnj;
use Illuminate\Support\Facades\Auth;

class BolScenarioService
{
    public function getScenarioWithRelations(string $id): ?BolScenario
    {
        $scenario = BolScenario::with($this->relations())->where('id', $id)->first();
        if ($scenario) $this->enrichDemonPouvoirs($scenario);
        return $scenario;
    }

    public function getScenariosWithRelations()
    {
        $scenarios = BolScenario::with($this->relations())
            ->where('user_id', Auth::id())
            ->orderByDesc('created_at')
            ->get();
        $scenarios->each(fn($s) => $this->enrichDemonPouvoirs($s));
        return $scenarios;
    }

    public function create(array $input): ?BolScenario
    {
        $scenario = BolScenario::create([
            'user_id' => Auth::id(),
            'titre'   => $input['titre'] ?? null,
            'pitch'   => $input['pitch'] ?? null,
        ]);
        $this->syncCast($scenario->id, $input);

        return $this->getScenarioWithRelations($scenario->id);
    }

    /** Enregistre un scénario du compte ; `null` si ce n'en est pas un. */
    public function update(array $input): ?BolScenario
    {
        $scenario = BolScenario::where('id', $input['id'] ?? null)
            ->where('user_id', Auth::id())
            ->first();
        if (!$scenario) {
            return null;
        }

        $scenario->update([
            'titre' => $input['titre'] ?? null,
            'pitch' => $input['pitch'] ?? null,
        ]);
        $this->syncCast($scenario->id, $input);

        return $this->getScenarioWithRelations($scenario->id);
    }

    public function delete(string $id): void
    {
        BolScenario::where('id', $id)->where('user_id', Auth::id())->delete();
    }

    private function syncCast(string $scenarioId, array $input): void
    {
        $this->syncPj($scenarioId, $input['pj'] ?? []);
        $this->syncCreatures($scenarioId, $input['creatures'] ?? []);
        $this->syncDemons($scenarioId, $input['demons'] ?? []);
        $this->syncPnjs($scenarioId, $input['pnjs'] ?? []);
    }

    private function syncCreatures(string $scenarioId, array $creatureList): void
    {
        BolScenarioCreature::where('scenario_id', $scenarioId)->delete();
        foreach ($creatureList as $item) {
            $creature = BolCreature::accessibleTo(Auth::id())->with('capacites.capacite')->find($item['creatureId']);
            if (!$creature) {
                continue;
            }
            BolScenarioCreature::create([
                'scenario_id'       => $scenarioId,
                'creature_id'       => $creature->id,
                'surnom'            => $item['surnom'] ?? null,
                'rang'              => $item['rang'] ?? 'coriace',
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
                'capacites'         => BolCombatantCopies::capacites($creature),
            ]);
        }
    }

    private function syncDemons(string $scenarioId, array $demonList): void
    {
        BolScenarioDemon::where('scenario_id', $scenarioId)->delete();
        foreach ($demonList as $item) {
            $demon = BolDemon::accessibleTo(Auth::id())->with('pouvoirs.pouvoir')->find($item['demonId']);
            if (!$demon) {
                continue;
            }
            BolScenarioDemon::create([
                'scenario_id'       => $scenarioId,
                'demon_id'          => $demon->id,
                'surnom'            => $item['surnom'] ?? null,
                'rang'              => $item['rang'] ?? 'rival',
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
                'pouvoirs'          => BolCombatantCopies::pouvoirs($demon),
            ]);
        }
    }

    private function syncPnjs(string $scenarioId, array $pnjList): void
    {
        BolScenarioPnj::where('scenario_id', $scenarioId)->delete();
        foreach ($pnjList as $item) {
            $pnj = BolHeros::accessibleTo(Auth::id())->find($item['pnjId']);
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
                'rang'              => $item['rang'] ?? 'coriace',
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
            if (!BolHeros::accessibleTo(Auth::id())->whereKey($pj['heroId'])->exists()) {
                continue;
            }
            BolScenarioPj::create([
                'scenario_id' => $scenarioId,
                'heros_id'    => $pj['heroId'],
            ]);
        }
    }

    private function enrichDemonPouvoirs(BolScenario $scenario): void
    {
        $demons = $scenario->demons;
        if (!$demons || $demons->isEmpty()) return;

        $pouvoirIds = $demons->flatMap(fn($d) => collect($d->pouvoirs ?? [])->pluck('pouvoir_id'))->unique()->filter();
        if ($pouvoirIds->isEmpty()) return;

        $flags = BolPouvoir::whereIn('id', $pouvoirIds)
            ->get(['id', 'description', 'avantage_attaque', 'degats_superieurs', 'regeneration', 'intangible', 'avertissement_combat'])
            ->keyBy('id');

        $demons->each(function ($demon) use ($flags) {
            $demon->pouvoirs = collect($demon->pouvoirs ?? [])->map(function ($p) use ($flags) {
                $f = $flags->get($p['pouvoir_id'] ?? null);
                return array_merge($p, [
                    'description'         => $f?->description ?? null,
                    'avantage_attaque'    => (bool) ($f?->avantage_attaque ?? false),
                    'degats_superieurs'   => (bool) ($f?->degats_superieurs ?? false),
                    'regeneration'        => (bool) ($f?->regeneration ?? false),
                    'intangible'          => (bool) ($f?->intangible ?? false),
                    'avertissement_combat'=> (bool) ($f?->avertissement_combat ?? false),
                ]);
            })->values()->toArray();
        });
    }

    private function relations(): array
    {
        return [
            'pj.heros',
            'pj.heros.armes.arme',
            'pj.heros.armures.armure',
            'creatures',
            'creatures.creature',
            'demons',
            'demons.demon',
            'pnjs',
            'pnjs.pnj',
        ];
    }
}
