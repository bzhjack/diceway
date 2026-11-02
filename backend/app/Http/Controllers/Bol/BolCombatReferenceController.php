<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolReferenceData;

class BolCombatReferenceController extends Controller
{
    public function __construct(private readonly BolReferenceData $reference) {}

    public function getCombatOptions()
    {
        return response()->json($this->reference->combatOptions());
    }
}
