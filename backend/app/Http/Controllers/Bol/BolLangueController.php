<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Bol\Concerns\ProtectsHeros;
use App\Http\Services\Bol\BolHeroDetailsService;
use App\Http\Services\Bol\BolReferenceData;
use Illuminate\Http\Request;

class BolLangueController extends Controller
{
    use ProtectsHeros;

    public function __construct(
        private readonly BolReferenceData $reference,
        private readonly BolHeroDetailsService $details,
    ) {}

    /**
     * Récupère toutes les langues
     */
    public function getAll()
    {
        return response()->json($this->reference->langues());
    }

    public function delete($herosId, $id)
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
        $langue = $this->details->langue($herosId, $id);
        if (!$langue) {
            return response()->json(['message' => 'Langue non trouvée'], 404);
        }
        $this->details->remove($langue);
        return response()->json(['success' => true]);
    }

    public function create(Request $request, $herosId)
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
        $newLangue = $request->input();
        if ($this->details->langue($herosId, $newLangue['langue_id'])) {
            return response()->json(['message' => 'Langue déjà existante'], 403);
        }
        $this->details->addLangue($herosId, $newLangue);
        return response()->json(['success' => $newLangue]);
    }
}
