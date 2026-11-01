<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Bol\Concerns\ProtectsHeros;
use App\Http\Services\Bol\BolHeroDetailsService;
use App\Http\Services\Bol\BolReferenceData;
use Illuminate\Http\Request;

class BolCarriereController extends Controller
{
    use ProtectsHeros;

    public function __construct(
        private readonly BolReferenceData $reference,
        private readonly BolHeroDetailsService $details,
    ) {}

    public function getAll()
    {
        return response()->json($this->reference->carrieres());
    }

    public function delete($herosId, $id)
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
        $carriere = $this->details->carriere($herosId, $id);
        if (!$carriere) {
            return response()->json(['message' => 'Carrière non trouvée'], 404);
        }
        $this->details->remove($carriere);
        return response()->json(['success' => true]);
    }

    public function create(Request $request, $herosId)
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
        $newCarriere = $request->input();
        if ($this->details->carriere($herosId, $newCarriere['carriere_id'])) {
            return response()->json(['message' => 'Carrière déjà existante'], 403);
        }
        $this->details->addCarriere($herosId, $newCarriere);
        return response()->json(['success' => $newCarriere]);
    }
}
