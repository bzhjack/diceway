<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Bol\BolArme;

class BolArmeController extends Controller
{
    public function getAllArmes()
    {
        $donnees = BolArme::all();
        return response()->json($donnees);
    }
}
