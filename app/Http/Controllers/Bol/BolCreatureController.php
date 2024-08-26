<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolCreature;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

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
