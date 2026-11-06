<?php

namespace App\Http\Controllers\Cpr;

use App\Http\Controllers\Controller;
use App\Http\Services\Cpr\CprReferenceData;

class CprReferenceController extends Controller
{
    public function __construct(private readonly CprReferenceData $reference) {}

    public function getAll()
    {
        return response()->json($this->reference->all());
    }
}
