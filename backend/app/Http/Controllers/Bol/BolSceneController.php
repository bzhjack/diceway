<?php

namespace App\Http\Controllers\Bol;

use App\Exceptions\Bol\SceneLoadNotAllowedException;
use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolScenePreparation;
use App\Http\Services\Bol\BolSceneService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class BolSceneController extends Controller
{
    public function __construct(private readonly BolSceneService $sceneService) {}

    public function getAll()
    {
        return response()->json($this->sceneService->getScenes(Auth::id()));
    }

    public function create(Request $request)
    {
        $data = $request->validate([
            'titre'       => 'required|string|max:120',
            'scenario_id' => 'nullable|string',
            'session_id'  => 'required|string',
        ]);

        $scene = $this->sceneService->createFromSession(
            Auth::id(),
            $data['titre'],
            $data['scenario_id'] ?? null,
            $data['session_id'],
        );

        return $scene ? response()->json($scene) : $this->notFound();
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'id'          => 'required|string',
            'titre'       => 'sometimes|required|string|max:120',
            'notes'       => 'sometimes|nullable|string|max:10000',
            'scenario_id' => 'sometimes|nullable|string',
            'region_id'   => 'sometimes|nullable|integer|exists:bol_region,id',
            'lieu'        => 'sometimes|nullable|string|max:120',
            'moment'      => ['sometimes', 'nullable', Rule::in(BolScenePreparation::MOMENTS)],
            'meteo'       => ['sometimes', 'nullable', Rule::in(BolScenePreparation::METEOS)],
            'danger'      => 'sometimes|nullable|integer|between:1,4',
            'lecture'     => 'sometimes|nullable|string|max:5000',
            'jeu'         => 'sometimes|nullable|string|max:10000',
            'pistes'      => 'sometimes|nullable|array|max:' . BolScenePreparation::PISTES_MAX,
            // Une piste vide est retirée par le service (BolScenePreparation::pistes), pas refusée.
            'pistes.*.texte'    => 'nullable|string|max:' . BolScenePreparation::PISTE_TEXTE_MAX,
            'pistes.*.scene_id' => 'nullable|string',
            'image'       => ['sometimes', 'nullable', 'string', 'max:500', 'regex:#^(https://|/assets/)#'],
        ]);

        $scene = $this->sceneService->update(
            Auth::id(),
            $data['id'],
            array_intersect_key($data, array_flip([
                'titre', 'notes', 'scenario_id', 'region_id', 'lieu', 'moment', 'meteo', 'danger', 'lecture', 'jeu', 'pistes', 'image',
            ])),
        );

        return $scene ? response()->json($scene) : $this->notFound();
    }

    public function reorder(Request $request)
    {
        $data = $request->validate([
            'scenario_id' => 'nullable|string',
            'ordre'       => 'present|array',
            'ordre.*'     => 'string',
        ]);

        $this->sceneService->reorder(Auth::id(), $data['scenario_id'] ?? null, $data['ordre']);

        return response()->json(true);
    }

    public function replaceDistribution(Request $request, string $id)
    {
        $data = $request->validate(['session_id' => 'required|string']);

        $scene = $this->sceneService->replaceDistribution(Auth::id(), $id, $data['session_id']);

        return $scene ? response()->json($scene) : $this->notFound();
    }

    public function delete(string $id)
    {
        $this->sceneService->delete(Auth::id(), $id);

        return response()->json(true);
    }

    public function load(Request $request, string $id)
    {
        $data = $request->validate([
            'scene_id' => 'required|string',
            'mode'     => 'required|in:replace,add',
        ]);

        try {
            $result = $this->sceneService->loadIntoSession(Auth::id(), $id, $data['scene_id'], $data['mode']);
        } catch (SceneLoadNotAllowedException) {
            return response()->json(['error' => 'Terminez le combat avant de charger une scène.'], 409);
        }

        return $result ? response()->json($result) : $this->notFound();
    }

    /** Vide la table de la session (PNJ, créatures, démons) et oublie sa scène en cours ; les héros restent. */
    public function clearTable(string $id)
    {
        try {
            $session = $this->sceneService->clearTable(Auth::id(), $id);
        } catch (SceneLoadNotAllowedException) {
            return response()->json(['error' => 'Terminez le combat avant de vider la table.'], 409);
        }

        return $session ? response()->json($session) : $this->notFound();
    }

    private function notFound()
    {
        return response()->json(['error' => 'Not found'], 404);
    }
}
