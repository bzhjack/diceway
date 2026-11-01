<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolDashboardService;
use Illuminate\Support\Facades\Auth;

class BolDashboardController extends Controller
{
    public function __construct(private readonly BolDashboardService $dashboard) {}

    public function getCounts()
    {
        return response()->json($this->dashboard->counts(Auth::id()));
    }
}
