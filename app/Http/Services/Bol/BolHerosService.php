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
}
