<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolCreature;
use Illuminate\Support\Facades\Auth;

class BolCreatureController extends Controller
{
    //
    /**
     * Récupère tout les héros
     */
    public function getAll()
    {
        $heroes = BolCreature::with('traits.traitable', 'carrieres.carriere', 'armures.armure', 'armes.arme', 'langues.langue')->where('user_id', Auth::id())->get();
        return response($heroes);
    }
}
