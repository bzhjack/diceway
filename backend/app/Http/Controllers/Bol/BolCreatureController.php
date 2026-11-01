<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolCreatureService;
use App\Http\Services\Bol\BolReferenceData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class BolCreatureController extends Controller
{
    public function __construct(
        private readonly BolCreatureService $bolCreatureService,
        private readonly BolReferenceData $reference,
    ) {}

    public function getAll()
    {
        return response($this->bolCreatureService->cachedList());
    }

    /**
     * Récupère une créature par son id
     */
    public function getOne(Request $request)
    {
        $creature = $this->bolCreatureService->getCreatureWithRelations($request->route('id'));
        if ($creature === null || Gate::denies('view', $creature)) {
            return response()->json(['error' => 'Créature not found'], 404);
        }
        return response($creature);
    }

    public function getAllTailles()
    {
        return response($this->reference->tailles());
    }

    public function getAllCapacites()
    {
        return response($this->reference->capacites());
    }

    public function create(Request $request)
    {
        return response($this->bolCreatureService->create($request->input()));
    }

    public function update(Request $request)
    {
        $creature = $this->bolCreatureService->update($request->input());
        if ($creature === null) {
            return response()->json(['error' => 'Creature not found'], 404);
        }
        return response($creature);
    }

    public function delete($id): JsonResponse
    {
        $bolCreature = $this->bolCreatureService->find($id);
        // Check if the resource exists
        if (!$bolCreature || Gate::denies('delete', $bolCreature)) {
            return response()->json(['message' => 'Creature not found'], Response::HTTP_NOT_FOUND);
        }
        $this->bolCreatureService->delete($bolCreature);
        return response()->json(['message' => 'Creature deleted successfully'], Response::HTTP_OK);
    }
}
