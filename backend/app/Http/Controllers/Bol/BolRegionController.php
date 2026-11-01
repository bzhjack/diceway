<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolReferenceData;
use Illuminate\Http\Request;

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

    public function getOne(Request $request)
    {
        $region = $this->reference->region($request->route('id'));
        if ($region === null) {
            return response()->json(['error' => 'Country not found'], 404);
        }
        return response($region);
    }
}
