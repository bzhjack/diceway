<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolHeros;
use Illuminate\Support\Facades\Auth;

class BolHerosService
{
    public function getHeroWithRelations($herosId)
    {
        return BolHeros::with($this->heroRelations())
            ->where('id', $herosId)
            ->first();
    }
    public function getHeroesWithRelations()
    {
        return BolHeros::with($this->heroRelations())
            ->where('type', 'H')
            ->where('user_id', Auth::id())
            ->get();
    }

    private function heroRelations()
    {
        return [
            'traits.traitable',
            'carrieres.carriere',
            'armures.armure',
            'armes.arme',
            'langues.langue',
            'region',
        ];
    }

    /** Ajuste l'héroïsme d'un héros (delta positif ou négatif), borné à 0 minimum. */
    public function adjustHeroisme(string $herosId, string $userId, int $delta): ?BolHeros
    {
        $heros = BolHeros::where('id', $herosId)->where('user_id', $userId)->first();
        if (!$heros) {
            return null;
        }

        $heros->update(['heroisme' => max(0, $heros->heroisme + $delta)]);

        return $heros->fresh();
    }
}
