<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolReferenceData;

class BolRegionController extends Controller
{
    public function __construct(private readonly BolReferenceData $reference) {}

    /**
     * Récupère toutes les régions
     */
    public function getAll()
    {
        return response()->json($this->reference->regions());
    }
}
