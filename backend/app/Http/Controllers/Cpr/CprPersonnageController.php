<?php

namespace App\Http\Controllers\Cpr;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cpr\CprPersonnageRequest;
use App\Http\Services\Cpr\CprPersonnageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/** Les fiches de personnage de Cyberpunk RED. La fiche d'un autre compte répond 404, comme si elle n'existait pas. */
class CprPersonnageController extends Controller
{
    public function __construct(private readonly CprPersonnageService $personnages) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json($this->personnages->list($request->user()->id));
    }

    public function show(string $id): JsonResponse
    {
        $personnage = $this->personnages->find($id);
        if (!$personnage || Gate::denies('view', $personnage)) {
            return $this->introuvable();
        }
        return response()->json($personnage);
    }

    public function store(CprPersonnageRequest $request): JsonResponse
    {
        return $this->enregistrer(fn () => $this->personnages->save($request->validated(), $request->user()->id), 201);
    }

    public function update(CprPersonnageRequest $request, string $id): JsonResponse
    {
        $personnage = $this->personnages->find($id);
        if (!$personnage || Gate::denies('update', $personnage)) {
            return $this->introuvable();
        }
        return $this->enregistrer(fn () => $this->personnages->save($request->validated(), $request->user()->id, $personnage));
    }

    public function destroy(string $id): JsonResponse
    {
        $personnage = $this->personnages->find($id);
        if (!$personnage || Gate::denies('delete', $personnage)) {
            return $this->introuvable();
        }
        $this->personnages->delete($personnage);
        return response()->json(['success' => true]);
    }

    private function enregistrer(callable $enregistrement, int $statut = 200): JsonResponse
    {
        try {
            return response()->json($enregistrement(), $statut);
        } catch (ValidationException $erreur) {
            return response()->json(['message' => 'Fiche invalide', 'errors' => $erreur->errors()], 422);
        }
    }

    private function introuvable(): JsonResponse
    {
        return response()->json(['message' => 'Personnage introuvable'], 404);
    }
}
