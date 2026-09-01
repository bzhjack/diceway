<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolArmure;
use App\Models\Bol\BolHerosArmure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class BolArmureController extends Controller
{
    private const CACHE_KEY = 'bol_armures_all';

    public function getAll()
    {
        $cacheDuration = 60 * 24; // 60 minutes
        $cacheKey = self::CACHE_KEY . '_' . Auth::id();
        $donnees = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolArmure::query()
                ->where(function ($query) {
                    $query->whereNull('user_id')->orWhere('user_id', Auth::id());
                })
                ->orderByRaw('case when user_id is null then 0 else 1 end')
                ->orderBy('armure')
                ->get();
        });
        return response()->json($donnees);
    }

    public function createCatalog(Request $request)
    {
        $payload = $this->validatedPayload($request);

        $armure = new BolArmure();
        $armure->user_id = Auth::id();
        $armure->armure = $payload['armure'];
        $armure->protection = $payload['protection'];
        $armure->malus = $payload['malus'];
        $armure->pts_de_pouvoir = $payload['pts_de_pouvoir'];
        $armure->categorie = $payload['categorie'];
        $armure->malus_agilite = $payload['malus_agilite'];
        $armure->malus_initiative = $payload['malus_initiative'];
        $armure->malus_attaque_subie = $payload['malus_attaque_subie'];
        $armure->malus_attaque_subie_portee = $payload['malus_attaque_subie_portee'];
        $armure->save();

        $this->flushCache();

        return response()->json($armure, 201);
    }

    public function updateCatalog(Request $request)
    {
        $request->validate([
            'id' => ['required', 'integer'],
        ]);

        $id = (int) $request->input('id');
        $armure = BolArmure::query()->where('user_id', Auth::id())->find($id);

        if (!$armure) {
            return response()->json(['message' => 'Armure personnelle introuvable.'], 404);
        }

        $payload = $this->validatedPayload($request, $armure->id);

        $armure->armure = $payload['armure'];
        $armure->protection = $payload['protection'];
        $armure->malus = $payload['malus'];
        $armure->pts_de_pouvoir = $payload['pts_de_pouvoir'];
        $armure->categorie = $payload['categorie'];
        $armure->malus_agilite = $payload['malus_agilite'];
        $armure->malus_initiative = $payload['malus_initiative'];
        $armure->malus_attaque_subie = $payload['malus_attaque_subie'];
        $armure->malus_attaque_subie_portee = $payload['malus_attaque_subie_portee'];
        $armure->save();

        $this->flushCache();

        return response()->json($armure);
    }

    public function deleteCatalog(int $id)
    {
        $armure = BolArmure::query()->where('user_id', Auth::id())->find($id);

        if (!$armure) {
            return response()->json(['message' => 'Seules vos armures personnelles peuvent etre supprimees.'], 404);
        }

        if (BolHerosArmure::query()->where('armure_id', $id)->exists()) {
            return response()->json(
                ['message' => 'Cette armure est encore utilisée par des héros ou des PNJ.'],
                409,
            );
        }

        $armure->delete();
        $this->flushCache();

        return response()->json(['success' => true]);
    }

    public function create(Request $request, $herosId)
    {
        $newArmure = $request->input();
        $carriere = BolHerosArmure::where('heros_id', $herosId)->where('armure_id', $newArmure['armure_id'])->first();
        if ($carriere) {
            return response()->json(['message' => 'Armure déjà existante'], 403);
        }
        $heros_carrieres = [
            'heros_id' => $herosId,
            'armure_id' => $newArmure['armure_id']
        ];
        BolHerosArmure::create($heros_carrieres);
        return response()->json(['success' => $newArmure]);
    }

    public static function delete($herosId, $id)
    {
        $armure = BolHerosArmure::where('heros_id', $herosId)->where('armure_id', $id)->first();
        if (!$armure) {
            return response()->json(['message' => 'Armure non trouvée'], 404);
        }
        $armure->delete();
        return response()->json(['success' => true]);
    }

    /** Bascule l'équipement d'une armure de héros/PNJ ; n'en laisse qu'une équipée par catégorie (armure/bouclier/casque). */
    public function equip($herosId, $id)
    {
        $pivot = BolHerosArmure::with('armure')->where('heros_id', $herosId)->where('armure_id', $id)->first();
        if (!$pivot) {
            return response()->json(['message' => 'Armure non trouvée'], 404);
        }

        $equipee = !$pivot->equipee;

        if ($equipee && $pivot->armure) {
            BolHerosArmure::where('heros_id', $herosId)
                ->where('armure_id', '!=', $id)
                ->whereHas('armure', fn ($query) => $query->where('categorie', $pivot->armure->categorie))
                ->update(['equipee' => false]);
        }

        $pivot->equipee = $equipee;
        $pivot->save();

        return response()->json(['success' => true, 'equipee' => $equipee]);
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

    private function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY . '_' . Auth::id());
    }
}
