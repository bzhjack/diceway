<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolArmure;
use App\Models\Bol\BolHerosArmure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

/** Le catalogue d'armures (le public et celui du compte), et les armures d'une fiche. */
class BolArmureService
{
    public function catalog()
    {
        return Cache::remember(BolCache::armures(Auth::id()), BolCache::TTL, function () {
            return BolArmure::query()
                ->where(function ($query) {
                    $query->whereNull('user_id')->orWhere('user_id', Auth::id());
                })
                ->orderByRaw('case when user_id is null then 0 else 1 end')
                ->orderBy('armure')
                ->get();
        });
    }

    /** Une armure personnelle du compte : les autres ne se modifient pas. */
    public function ownEntry(int $id): ?BolArmure
    {
        return BolArmure::query()->where('user_id', Auth::id())->find($id);
    }

    public function createEntry(array $payload): BolArmure
    {
        $armure = new BolArmure();
        $armure->user_id = Auth::id();

        return $this->saveEntry($armure, $payload);
    }

    public function saveEntry(BolArmure $armure, array $payload): BolArmure
    {
        $armure->armure = $payload['armure'];
        $armure->protection = $payload['protection'];
        $armure->malus = $payload['malus'];
        $armure->pts_de_pouvoir = $payload['pts_de_pouvoir'];
        $armure->categorie = $payload['categorie'];
        $armure->malus_agilite = $payload['malus_agilite'];
        $armure->malus_initiative = $payload['malus_initiative'];
        $armure->malus_attaque_subie = $payload['malus_attaque_subie'];
        $armure->malus_attaque_subie_portee = $payload['malus_attaque_subie_portee'];
        $armure->save();
        $this->flushCache();

        return $armure;
    }

    public function isWorn(int $id): bool
    {
        return BolHerosArmure::query()->where('armure_id', $id)->exists();
    }

    public function deleteEntry(BolArmure $armure): void
    {
        $armure->delete();
        $this->flushCache();
    }

    public function isAccessible(mixed $id): bool
    {
        return BolArmure::accessibleTo(Auth::id())->whereKey($id)->exists();
    }

    public function onSheet(string $herosId, mixed $armureId): ?BolHerosArmure
    {
        return BolHerosArmure::where('heros_id', $herosId)->where('armure_id', $armureId)->first();
    }

    public function give(string $herosId, mixed $armureId): void
    {
        BolHerosArmure::create(['heros_id' => $herosId, 'armure_id' => $armureId]);
    }

    /** Bascule l'équipement d'une armure de héros/PNJ ; n'en laisse qu'une équipée par catégorie (armure/bouclier/casque). */
    public function toggleEquipped(BolHerosArmure $pivot, string $herosId, mixed $armureId): bool
    {
        $equipee = !$pivot->equipee;

        if ($equipee && $pivot->armure) {
            BolHerosArmure::where('heros_id', $herosId)
                ->where('armure_id', '!=', $armureId)
                ->whereHas('armure', fn ($query) => $query->where('categorie', $pivot->armure->categorie))
                ->update(['equipee' => false]);
        }

        $pivot->equipee = $equipee;
        $pivot->save();

        app(BolFightSessionService::class)->refreshPnjSnapshots($herosId);

        return $equipee;
    }

    public function take(BolHerosArmure $pivot): void
    {
        $pivot->delete();
    }

    private function flushCache(): void
    {
        Cache::forget(BolCache::armures(Auth::id()));
    }
}
