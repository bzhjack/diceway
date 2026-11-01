<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolPnjService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class BolPnjController extends Controller
{
    public function __construct(private readonly BolPnjService $pnjService) {}

    /**
     * Récupère tout les pnj
     */
    public function getAll()
    {
        return response($this->pnjService->getPnjsWithRelations());
    }

    public function getOne(Request $request)
    {
        $pnj = $this->pnjService->getPnjWithRelations($request->route('id'));
        if ($pnj === null) {
            return response()->json(['error' => 'Pnj not found'], 404);
        }
        return response($pnj);
    }

    public function create(Request $request)
    {
        return response($this->pnjService->create($request->input()));
    }

    public function update(Request $request)
    {
        $pnj = $this->pnjService->update($request->input());
        if ($pnj === null) {
            return response()->json(['error' => 'Pnj not found'], 404);
        }
        return response($pnj);
    }

    public function delete($id): JsonResponse
    {
        $bolPnj = $this->pnjService->find($id);
        if (!$bolPnj || Gate::denies('delete', $bolPnj)) {
            return response()->json(['message' => 'Pnj not found'], Response::HTTP_NOT_FOUND);
        }
        $this->pnjService->delete($bolPnj);
        return response()->json(['message' => 'Character deleted successfully'], Response::HTTP_OK);
    }
}
