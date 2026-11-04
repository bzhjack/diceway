<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolDemon;
use App\Models\Bol\BolDemonPouvoir;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class BolDemonService
{
    public function getDemonWithRelations($DemonId)
    {
        return BolDemon::with($this->DemonRelations())
            ->where('id', $DemonId)
            ->first();
    }

    public function getDemonsWithRelations()
    {
        return BolDemon::with($this->DemonRelations())
            ->where('user_id', Auth::id())
            ->orWhereNull('user_id')
            ->orderBy('user_id', 'desc')
            ->orderBy('id_categorie')
            ->orderBy('nom')
            ->get();
    }

    /** La liste du compte, gardée en cache. */
    public function cachedList()
    {
        return Cache::remember(BolCache::demons(Auth::id()), BolCache::TTL, fn () => $this->getDemonsWithRelations());
    }

    public function find(string $id): ?BolDemon
    {
        return BolDemon::find($id);
    }

    public function create(array $input): ?BolDemon
    {
        $demon = Arr::except($input, ['id']);
        $demon['user_id'] = Auth::id();
        $demon = BolDemon::create($demon);
        foreach ($input['pouvoirs'] as $pouvoir) {
            BolDemonPouvoir::create(['demon_id' => $demon['id'], 'pouvoir_id' => $pouvoir['id'], 'detail' => $pouvoir['detail']]);
        }
        Cache::forget(BolCache::demons(Auth::id()));

        return BolDemon::with('categorie', 'pouvoirs.pouvoir')
            ->where('user_id', Auth::id())
            ->where('id', $demon['id'])->first();
    }

    /** Enregistre un démon du compte ; `null` si ce n'en est pas un. */
    public function update(array $input): ?BolDemon
    {
        $demonId = $input['id'] ?? null;
        $demon = BolDemon::with('categorie', 'pouvoirs')
            ->where('user_id', Auth::id())
            ->where('id', $demonId)->first();
        if ($demon === null) {
            return null;
        }

        // Supprimer les pouvoirs qui ne sont plus associés au démon
        $pouvoirs = $input['pouvoirs'];
        BolDemonPouvoir::whereNotIn('pouvoir_id', array_column($pouvoirs, 'id'))
            ->where('demon_id', $demonId)
            ->delete();

        // Mettre à jour ou insérer les nouveaux pouvoirs
        foreach ($pouvoirs as $item) {
            BolDemonPouvoir::updateOrCreate(
                ['demon_id' => $demonId, 'pouvoir_id' => $item['id']],
                ['detail' => $item['detail']]
            );
        }

        // Mettre à jour les autres champs du démon
        $demon->update(Arr::except($input, ['pouvoirs', 'id', 'user_id']));
        app(BolFightSessionService::class)->refreshDemonSnapshots((string) $demonId);
        Cache::forget(BolCache::demons(Auth::id()));

        return $this->getDemonWithRelations($demonId);
    }

    public function delete(BolDemon $demon): void
    {
        DB::transaction(fn () => $demon->delete());
        Cache::forget(BolCache::demons(Auth::id()));
    }

    private function DemonRelations()
    {
        return [
            'categorie', 'pouvoirs.pouvoir'
        ];
    }
}
