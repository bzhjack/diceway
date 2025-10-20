<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolCreature;
use Illuminate\Support\Facades\Auth;

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

    private function creatureRelations()
    {
        return [
          'taille', 'capacites.capacite'
        ];
    }
}
