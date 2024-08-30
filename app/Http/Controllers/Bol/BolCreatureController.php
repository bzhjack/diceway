<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolTaille;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class BolCreatureController extends Controller
{
    //
    /**
     * Récupère toutes les creatures
     */
    public function getAll()
    {
        $creatures = BolCreature::with('taille', 'capacites.capacite')->where('user_id', Auth::id())->orWhereNull('user_id')->orderBy('nom', 'asc')->get();
        return response($creatures);
    }
    public function getAllTailles()
    {
        $tailles = BolTaille::orderBy('id', 'asc')->get();
        return response($tailles);
    }

}
