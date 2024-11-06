<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolDemon;
use Illuminate\Support\Facades\Auth;

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

    private function DemonRelations()
    {
        return [
            'categorie', 'pouvoirs.pouvoir'
        ];
    }
}
