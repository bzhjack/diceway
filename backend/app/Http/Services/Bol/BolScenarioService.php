<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolPouvoir;
use App\Models\Bol\BolScenario;
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

    private function enrichDemonPouvoirs(BolScenario $scenario): void
    {
        $demons = $scenario->demons;
        if (!$demons || $demons->isEmpty()) return;

        $pouvoirIds = $demons->flatMap(fn($d) => collect($d->pouvoirs ?? [])->pluck('pouvoir_id'))->unique()->filter();
        if ($pouvoirIds->isEmpty()) return;

        $flags = BolPouvoir::whereIn('id', $pouvoirIds)
            ->get(['id', 'avantage_attaque', 'degats_superieurs', 'regeneration', 'intangible', 'avertissement_combat'])
            ->keyBy('id');

        $demons->each(function ($demon) use ($flags) {
            $demon->pouvoirs = collect($demon->pouvoirs ?? [])->map(function ($p) use ($flags) {
                $f = $flags->get($p['pouvoir_id'] ?? null);
                return array_merge($p, [
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
