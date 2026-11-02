<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolAccueilService;
use Illuminate\Support\Facades\Auth;

class BolAccueilController extends Controller
{
    public function __construct(private readonly BolAccueilService $accueil) {}

    public function show()
    {
        return response()->json($this->accueil->summary(Auth::id()));
    }
}
