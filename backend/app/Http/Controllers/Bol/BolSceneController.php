<?php

namespace App\Http\Controllers\Bol;

use App\Exceptions\Bol\SceneLoadNotAllowedException;
use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolSceneService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
        ]);

        $scene = $this->sceneService->update(
            Auth::id(),
            $data['id'],
            array_intersect_key($data, array_flip(['titre', 'notes', 'scenario_id'])),
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

    private function notFound()
    {
        return response()->json(['error' => 'Not found'], 404);
    }
}
