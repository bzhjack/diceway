<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolTaille;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BolCreatureController extends Controller
{
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

 public function create(Request $request)
    {
        $creature = $request->input();
        $creature['user_id'] = Auth::id();
        $creature = BolCreature::create($creature);
        return response($creature);
    }

}
