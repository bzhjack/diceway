<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Bol\Concerns\ProtectsHeros;
use App\Http\Services\Bol\BolHeroDetailsService;
use App\Http\Services\Bol\BolReferenceData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BolTraitController extends Controller
{
    use ProtectsHeros;

    public function __construct(
        private readonly BolReferenceData $reference,
        private readonly BolHeroDetailsService $details,
    ) {}

    public function getAllAvantages()
    {
        return response()->json($this->reference->avantages());
    }

    public function getAllDesavantages()
    {
        return response()->json($this->reference->desavantages());
    }

    public function delete($herosId, $id): JsonResponse
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
        $trait = $this->details->trait($herosId, $id);
        if (!$trait) {
            return response()->json(['message' => 'Trait non trouvé'], 404);
        }
        $this->details->remove($trait);
        return response()->json(['success' => true]);
    }

    public function create(Request $request, $herosId)
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
        $newTrait = $request->input();
        if ($this->details->hasTrait($herosId, $newTrait['traitable_id'], $newTrait['type'])) {
            return response()->json(['message' => 'Traits déjà existant'], 403);
        }
        return response()->json($this->details->addTrait($herosId, $newTrait));
    }
}
