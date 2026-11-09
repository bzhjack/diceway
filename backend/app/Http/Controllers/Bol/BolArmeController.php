<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Bol\Concerns\ProtectsHeros;
use App\Http\Services\Bol\BolArmeService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BolArmeController extends Controller
{
    use ProtectsHeros;

    public function __construct(private readonly BolArmeService $armes) {}

    public function getAll()
    {
        return response()->json($this->armes->catalog());
    }

    public function createCatalog(Request $request)
    {
        return response()->json($this->armes->createEntry($this->validatedPayload($request)), 201);
    }

    public function updateCatalog(Request $request)
    {
        $request->validate([
            'id' => ['required', 'integer'],
        ]);

        $arme = $this->armes->ownEntry((int) $request->input('id'));
        if (!$arme) {
            return response()->json(['message' => 'Arme personnelle introuvable.'], 404);
        }

        return response()->json($this->armes->saveEntry($arme, $this->validatedPayload($request, $arme->id)));
    }

    public function deleteCatalog(int $id)
    {
        $arme = $this->armes->ownEntry($id);
        if (!$arme) {
            return response()->json(['message' => 'Seules vos armes personnelles peuvent etre supprimees.'], 404);
        }

        if ($this->armes->isCarried($id)) {
            return response()->json(
                ['message' => 'Cette arme est encore utilisée par des héros ou des PNJ.'],
                409,
            );
        }

        $this->armes->deleteEntry($arme);

        return response()->json(['success' => true]);
    }

    public function create(Request $request, $herosId)
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
        $newArme = $request->input();
        if (!$this->armes->isAccessible($newArme['arme_id'] ?? null)) {
            return response()->json(['message' => 'Arme non trouvée'], 404);
        }
        if ($this->armes->onSheet($herosId, $newArme['arme_id'])) {
            return response()->json(['message' => 'Arme déjà existante'], 403);
        }
        $this->armes->give($herosId, $newArme['arme_id']);
        return response()->json(['success' => $newArme]);
    }

    public function equip($herosId, $id)
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
        $pivot = $this->armes->onSheet($herosId, $id);
        if (!$pivot) {
            return response()->json(['message' => 'Arme non trouvée'], 404);
        }

        return response()->json(['success' => true, 'equipee' => $this->armes->toggleEquipped($pivot, (string) $herosId)]);
    }

    public function delete($herosId, $id)
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
        $pivot = $this->armes->onSheet($herosId, $id);
        if (!$pivot) {
            return response()->json(['message' => 'Arme non trouvée'], 404);
        }
        $this->armes->take($pivot);
        return response()->json(['success' => true]);
    }

    private function validatedPayload(Request $request, ?int $ignoreId = null): array
    {
        $request->merge([
            'arme' => is_string($request->input('arme')) ? trim($request->input('arme')) : $request->input('arme'),
            'degats' => is_string($request->input('degats')) ? trim($request->input('degats')) : $request->input('degats'),
            'portee' => is_string($request->input('portee')) ? trim($request->input('portee')) : $request->input('portee'),
            'notes' => is_string($request->input('notes')) ? trim($request->input('notes')) : $request->input('notes'),
        ]);

        $validated = $request->validate([
            'arme' => ['required', 'string', 'max:255', Rule::unique('bol_arme', 'arme')->ignore($ignoreId)],
            'type' => ['required', Rule::in(['M', 'T'])],
            'degats' => ['required', 'string', 'max:50'],
            'portee' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'deux_mains' => ['sometimes', 'boolean'],
            'ignore_bouclier' => ['sometimes', 'boolean'],
            'non_letal' => ['sometimes', 'boolean'],
            'rechargement' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:9'],
        ]);

        $validated['portee'] = isset($validated['portee']) && $validated['portee'] !== '' ? $validated['portee'] : null;
        $validated['notes'] = isset($validated['notes']) && $validated['notes'] !== '' ? $validated['notes'] : null;

        return $validated;
    }
}
