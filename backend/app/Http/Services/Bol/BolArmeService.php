<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolArme;
use App\Models\Bol\BolHerosArme;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

/** Le catalogue d'armes (le public et celui du compte), et les armes d'une fiche. */
class BolArmeService
{
    public function catalog()
    {
        return Cache::remember(BolCache::armes(Auth::id()), BolCache::TTL, function () {
            return BolArme::query()
                ->where(function ($query) {
                    $query->whereNull('user_id')->orWhere('user_id', Auth::id());
                })
                ->orderByRaw('case when user_id is null then 0 else 1 end')
                ->orderBy('type')
                ->orderBy('arme')
                ->get();
        });
    }

    /** Une arme personnelle du compte : les autres ne se modifient pas. */
    public function ownEntry(int $id): ?BolArme
    {
        return BolArme::query()->where('user_id', Auth::id())->find($id);
    }

    public function createEntry(array $payload): BolArme
    {
        $arme = new BolArme();
        $arme->user_id = Auth::id();

        return $this->saveEntry($arme, $payload);
    }

    public function saveEntry(BolArme $arme, array $payload): BolArme
    {
        $arme->arme = $payload['arme'];
        $arme->type = $payload['type'];
        $arme->degats = $payload['degats'];
        $arme->portee = $payload['portee'];
        $arme->notes = $payload['notes'];
        $arme->deux_mains = $payload['deux_mains'] ?? false;
        $arme->save();
        $this->flushCache();

        return $arme;
    }

    public function isCarried(int $id): bool
    {
        return BolHerosArme::query()->where('arme_id', $id)->exists();
    }

    public function deleteEntry(BolArme $arme): void
    {
        $arme->delete();
        $this->flushCache();
    }

    public function isAccessible(mixed $id): bool
    {
        return BolArme::accessibleTo(Auth::id())->whereKey($id)->exists();
    }

    public function onSheet(string $herosId, mixed $armeId): ?BolHerosArme
    {
        return BolHerosArme::where('heros_id', $herosId)->where('arme_id', $armeId)->first();
    }

    public function give(string $herosId, mixed $armeId): void
    {
        BolHerosArme::create(['heros_id' => $herosId, 'arme_id' => $armeId]);
    }

    /** Équipe ou déséquipe une arme du héros. Contrairement aux armures, pas d'exclusivité : plusieurs armes
     * peuvent être équipées (combat à deux armes). */
    public function toggleEquipped(BolHerosArme $pivot, string $herosId): bool
    {
        $pivot->equipee = !$pivot->equipee;
        $pivot->save();
        app(BolFightSessionService::class)->refreshPnjSnapshots($herosId);

        return $pivot->equipee;
    }

    public function take(BolHerosArme $pivot): void
    {
        $pivot->delete();
    }

    private function flushCache(): void
    {
        Cache::forget(BolCache::armes(Auth::id()));
    }
}
