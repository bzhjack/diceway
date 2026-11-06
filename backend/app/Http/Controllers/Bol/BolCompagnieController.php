<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolCompagnieService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class BolCompagnieController extends Controller
{
    private const REGLES = ['nom' => 'required|string|max:255', 'heros' => 'required|array|min:1'];

    public function __construct(private readonly BolCompagnieService $compagnieService) {}

    public function getAll()
    {
        return response()->json($this->compagnieService->liste(Auth::id()));
    }

    public function create(Request $request)
    {
        $data = $request->validate(self::REGLES);

        return response()->json($this->compagnieService->creer(Auth::id(), $data['nom'], $data['heros']) ?? $this->sansHeros());
    }

    public function update(Request $request)
    {
        $compagnie = $this->compagnieService->trouver((string) $request->input('id'), Auth::id());
        if (!$compagnie) {
            return response()->json(['error' => 'Not found'], 404);
        }
        $data = $request->validate(self::REGLES);

        return response()->json($this->compagnieService->modifier($compagnie, $data['nom'], $data['heros']) ?? $this->sansHeros());
    }

    public function delete(string $id)
    {
        $compagnie = $this->compagnieService->trouver($id, Auth::id());
        if (!$compagnie) {
            return response()->json(['error' => 'Not found'], 404);
        }
        if (!$this->compagnieService->supprimer($compagnie)) {
            return response()->json(['error' => 'Cette compagnie a encore des parties : supprimez-les d’abord.'], 422);
        }

        return response()->json(true);
    }

    private function sansHeros(): never
    {
        throw ValidationException::withMessages(['heros' => 'Une compagnie a au moins un de vos héros.']);
    }
}
