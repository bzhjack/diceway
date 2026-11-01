<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolCreature;
use App\Models\Bol\BolCreatureCapacite;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class BolCreatureService
{
    public function getCreatureWithRelations($creatureId)
    {
        return BolCreature::with($this->creatureRelations())
            ->where('id', $creatureId)
            ->first();
    }
    public function getCreaturesWithRelations()
    {
        return BolCreature::with($this->creatureRelations())
            ->where('user_id', Auth::id())
            ->orWhereNull('user_id')
            ->orderBy('user_id', 'desc')
            ->orderBy('id_taille')
            ->orderBy('nom')
            ->get();
    }

    /** La liste du compte, gardée en cache. */
    public function cachedList()
    {
        return Cache::remember(BolCache::creatures(Auth::id()), BolCache::TTL, fn () => $this->getCreaturesWithRelations());
    }

    public function find(string $id): ?BolCreature
    {
        return BolCreature::find($id);
    }

    public function create(array $input): ?BolCreature
    {
        $creature = Arr::except($input, ['id']);
        $creature['user_id'] = Auth::id();
        $creature = BolCreature::create($creature);
        foreach ($input['capacites'] as $capacite) {
            BolCreatureCapacite::create(['creature_id' => $creature['id'], 'capacite_id' => $capacite['id'], 'detail' => $capacite['detail']]);
        }
        Cache::forget(BolCache::creatures(Auth::id()));

        return BolCreature::with('taille', 'capacites.capacite')
            ->where('user_id', Auth::id())
            ->where('id', $creature['id'])->first();
    }

    /** Enregistre une créature du compte ; `null` si ce n'en est pas une. */
    public function update(array $input): ?BolCreature
    {
        $creatureId = $input['id'] ?? null;
        $creature = BolCreature::with('taille', 'capacites')
            ->where('user_id', Auth::id())
            ->where('id', $creatureId)->first();
        if ($creature === null) {
            return null;
        }

        // Supprimer les capacités qui ne sont plus associées à la créature
        $capacites = $input['capacites'];
        BolCreatureCapacite::whereNotIn('capacite_id', array_column($capacites, 'id'))
            ->where('creature_id', $creatureId)
            ->delete();

        // Mettre à jour ou insérer les nouvelles capacités
        foreach ($capacites as $item) {
            BolCreatureCapacite::updateOrCreate(
                ['creature_id' => $creatureId, 'capacite_id' => $item['id']],
                ['detail' => $item['detail']]
            );
        }

        // Mettre à jour les autres champs de la créature
        $creature->update(Arr::except($input, ['capacites', 'id', 'user_id']));
        app(BolFightSessionService::class)->refreshCreatureSnapshots((string) $creatureId);
        Cache::forget(BolCache::creatures(Auth::id()));

        return $this->getCreatureWithRelations($creatureId);
    }

    public function delete(BolCreature $creature): void
    {
        $creature->delete();
        Cache::forget(BolCache::creatures(Auth::id()));
    }

    private function creatureRelations()
    {
        return [
          'taille', 'capacites.capacite'
        ];
    }
}
