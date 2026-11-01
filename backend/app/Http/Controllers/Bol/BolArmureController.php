<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Bol\Concerns\ProtectsHeros;
use App\Http\Services\Bol\BolArmureService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BolArmureController extends Controller
{
    use ProtectsHeros;

    public function __construct(private readonly BolArmureService $armures) {}

    public function getAll()
    {
        return response()->json($this->armures->catalog());
    }

    public function createCatalog(Request $request)
    {
        return response()->json($this->armures->createEntry($this->validatedPayload($request)), 201);
    }

    public function updateCatalog(Request $request)
    {
        $request->validate([
            'id' => ['required', 'integer'],
        ]);

        $armure = $this->armures->ownEntry((int) $request->input('id'));
        if (!$armure) {
            return response()->json(['message' => 'Armure personnelle introuvable.'], 404);
        }

        return response()->json($this->armures->saveEntry($armure, $this->validatedPayload($request, $armure->id)));
    }

    public function deleteCatalog(int $id)
    {
        $armure = $this->armures->ownEntry($id);
        if (!$armure) {
            return response()->json(['message' => 'Seules vos armures personnelles peuvent etre supprimees.'], 404);
        }

        if ($this->armures->isWorn($id)) {
            return response()->json(
                ['message' => 'Cette armure est encore utilisée par des héros ou des PNJ.'],
                409,
            );
        }

        $this->armures->deleteEntry($armure);

        return response()->json(['success' => true]);
    }

    public function create(Request $request, $herosId)
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
        $newArmure = $request->input();
        if (!$this->armures->isAccessible($newArmure['armure_id'] ?? null)) {
            return response()->json(['message' => 'Armure non trouvée'], 404);
        }
        if ($this->armures->onSheet($herosId, $newArmure['armure_id'])) {
            return response()->json(['message' => 'Armure déjà existante'], 403);
        }
        $this->armures->give($herosId, $newArmure['armure_id']);
        return response()->json(['success' => $newArmure]);
    }

    public function delete($herosId, $id)
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
        $pivot = $this->armures->onSheet($herosId, $id);
        if (!$pivot) {
            return response()->json(['message' => 'Armure non trouvée'], 404);
        }
        $this->armures->take($pivot);
        return response()->json(['success' => true]);
    }

    public function equip($herosId, $id)
    {
        if (!$this->canEditHeros($herosId)) {
            return $this->herosNotFound();
        }
        $pivot = $this->armures->onSheet($herosId, $id);
        if (!$pivot) {
            return response()->json(['message' => 'Armure non trouvée'], 404);
        }

        return response()->json(['success' => true, 'equipee' => $this->armures->toggleEquipped($pivot, (string) $herosId, $id)]);
    }

    private function validatedPayload(Request $request, ?int $ignoreId = null): array
    {
        $request->merge([
            'armure' => is_string($request->input('armure')) ? trim($request->input('armure')) : $request->input('armure'),
            'protection' => is_string($request->input('protection')) ? trim($request->input('protection')) : $request->input('protection'),
            'malus' => is_string($request->input('malus')) ? trim($request->input('malus')) : $request->input('malus'),
            'pts_de_pouvoir' => is_string($request->input('pts_de_pouvoir'))
                ? trim($request->input('pts_de_pouvoir'))
                : $request->input('pts_de_pouvoir'),
        ]);

        $validated = $request->validate([
            'armure' => ['required', 'string', 'max:255', Rule::unique('bol_armure', 'armure')->ignore($ignoreId)],
            'protection' => ['required', 'string', 'max:255'],
            'malus' => ['nullable', 'string', 'max:255'],
            'pts_de_pouvoir' => ['nullable', 'string', 'max:50'],
            'categorie' => ['required', Rule::in(['armure', 'bouclier', 'casque'])],
            'malus_agilite' => ['nullable', 'integer', 'min:0'],
            'malus_initiative' => ['nullable', 'integer', 'min:0'],
            'malus_attaque_subie' => ['nullable', 'integer', 'min:0'],
            'malus_attaque_subie_portee' => ['nullable', Rule::in(['une', 'toutes'])],
        ]);

        $validated['malus'] = isset($validated['malus']) && $validated['malus'] !== '' ? $validated['malus'] : null;
        $validated['pts_de_pouvoir'] = isset($validated['pts_de_pouvoir']) && $validated['pts_de_pouvoir'] !== ''
            ? $validated['pts_de_pouvoir']
            : null;
        $validated['malus_agilite'] = (int) ($validated['malus_agilite'] ?? 0);
        $validated['malus_initiative'] = (int) ($validated['malus_initiative'] ?? 0);
        $validated['malus_attaque_subie'] = (int) ($validated['malus_attaque_subie'] ?? 0);
        $validated['malus_attaque_subie_portee'] = $validated['malus_attaque_subie_portee'] ?? null;

        return $validated;
    }
}
