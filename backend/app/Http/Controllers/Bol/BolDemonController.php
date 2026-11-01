<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolDemonService;
use App\Http\Services\Bol\BolReferenceData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class BolDemonController extends Controller
{
    public function __construct(
        private readonly BolDemonService $bolDemonService,
        private readonly BolReferenceData $reference,
    ) {}

    public function getAll()
    {
        return response($this->bolDemonService->cachedList());
    }

    /**
     * Récupère un démon par son id
     */
    public function getOne(Request $request)
    {
        $demon = $this->bolDemonService->getDemonWithRelations($request->route('id'));
        if ($demon === null || Gate::denies('view', $demon)) {
            return response()->json(['error' => 'Demon not found'], 404);
        }
        return response($demon);
    }

    public function getAllCategories()
    {
        return response($this->reference->categories());
    }

    public function getAllPouvoirs()
    {
        return response($this->reference->pouvoirs());
    }

    public function create(Request $request)
    {
        return response($this->bolDemonService->create($request->input()));
    }

    public function update(Request $request)
    {
        $demon = $this->bolDemonService->update($request->input());
        if ($demon === null) {
            return response()->json(['error' => 'Demon not found'], 404);
        }
        return response($demon);
    }

    public function delete($id): JsonResponse
    {
        $bolDemon = $this->bolDemonService->find($id);
        // Check if the resource exists
        if (!$bolDemon || Gate::denies('delete', $bolDemon)) {
            return response()->json(['message' => 'Demon not found'], Response::HTTP_NOT_FOUND);
        }
        $this->bolDemonService->delete($bolDemon);
        return response()->json(['message' => 'Demon deleted successfully'], Response::HTTP_OK);
    }
}
