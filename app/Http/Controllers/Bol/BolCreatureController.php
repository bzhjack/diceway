<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolCreature;

class BolCreatureController extends Controller
{
    //
    /**
     * Récupère tout les héros
     */
    public function getAll()
    {
        $creatures = BolCreature::with('taille', 'capacites')->get();
        return response($creatures);
    }
}
