<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolArme;
use App\Models\Bol\BolHerosArme;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class BolArmeController extends Controller
{
    private const CACHE_KEY = 'bol_armes_all';

    public function getAll()
    {
        $cacheDuration = 60 * 24; // 60 minutes
        $cacheKey = self::CACHE_KEY . '_' . Auth::id();
        $donnees = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolArme::query()
                ->where(function ($query) {
                    $query->whereNull('user_id')->orWhere('user_id', Auth::id());
                })
                ->orderByRaw('case when user_id is null then 0 else 1 end')
                ->orderBy('type')
                ->orderBy('arme')
                ->get();
        });
        return response()->json($donnees);
    }

    public function createCatalog(Request $request)
    {
        $payload = $this->validatedPayload($request);

        $arme = new BolArme();
        $arme->user_id = Auth::id();
        $arme->arme = $payload['arme'];
        $arme->type = $payload['type'];
        $arme->degats = $payload['degats'];
        $arme->portee = $payload['portee'];
        $arme->notes = $payload['notes'];
        $arme->save();

        $this->flushCache();

        return response()->json($arme, 201);
    }

    public function updateCatalog(Request $request)
    {
        $request->validate([
            'id' => ['required', 'integer'],
        ]);

        $id = (int) $request->input('id');
        $arme = BolArme::query()->where('user_id', Auth::id())->find($id);

        if (!$arme) {
            return response()->json(['message' => 'Arme personnelle introuvable.'], 404);
        }

        $payload = $this->validatedPayload($request, $arme->id);

        $arme->arme = $payload['arme'];
        $arme->type = $payload['type'];
        $arme->degats = $payload['degats'];
        $arme->portee = $payload['portee'];
        $arme->notes = $payload['notes'];
        $arme->save();

        $this->flushCache();

        return response()->json($arme);
    }

    public function deleteCatalog(int $id)
    {
        $arme = BolArme::query()->where('user_id', Auth::id())->find($id);

        if (!$arme) {
            return response()->json(['message' => 'Seules vos armes personnelles peuvent etre supprimees.'], 404);
        }

        if (BolHerosArme::query()->where('arme_id', $id)->exists()) {
            return response()->json(
                ['message' => 'Cette arme est encore utilisée par des héros ou des PNJ.'],
                409,
            );
        }

        $arme->delete();
        $this->flushCache();

        return response()->json(['success' => true]);
    }

    public function create(Request $request, $herosId)
    {
        $newArme = $request->input();
        $arme = BolHerosArme::where('heros_id', $herosId)->where('arme_id', $newArme['arme_id'])->first();
        if ($arme) {
            return response()->json(['message' => 'Arme déjà existante'], 403);
        }
        $heros_armes = [
            'heros_id' => $herosId,
            'arme_id' => $newArme['arme_id']
        ];
        BolHerosArme::create($heros_armes);
        return response()->json(['success' => $newArme]);
    }

    public static function delete($herosId, $id)
    {
        $armure = BolHerosArme::where('heros_id', $herosId)->where('arme_id', $id)->first();
        if (!$armure) {
            return response()->json(['message' => 'Arme non trouvée'], 404);
        }
        $armure->delete();
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
        ]);

        $validated['portee'] = isset($validated['portee']) && $validated['portee'] !== '' ? $validated['portee'] : null;
        $validated['notes'] = isset($validated['notes']) && $validated['notes'] !== '' ? $validated['notes'] : null;

        return $validated;
    }

    private function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY . '_' . Auth::id());
    }

}
