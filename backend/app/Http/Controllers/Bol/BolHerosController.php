<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolDesavantage;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosArme;
use App\Models\Bol\BolHerosArmure;
use App\Models\Bol\BolHerosCarriere;
use App\Models\Bol\BolHerosLangue;
use App\Models\Bol\BolHerosTrait;
use App\Http\Services\Bol\BolEquipmentEffectService;
use App\Http\Services\Bol\BolHerosService;
use App\Http\Requests\Bol\BolHerosRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class BolHerosController extends Controller
{

    protected $bolHerosService;

    public function __construct(BolHerosService $bolHerosService)
    {
        $this->bolHerosService = $bolHerosService;
    }

    /**
     * Récupère tout les héros
     */
    public function getAll()
    {
        $heroes = $this->bolHerosService->getHeroesWithRelations();
        return response($heroes);
    }

    /**
     * Récupère un héro par son id
     */
    public function getOne(Request $request)
    {
        $id = $request->route('id');
        $hero = $this->bolHerosService->getHeroWithRelations($id);
        if ($hero === null) {
            return response()->json(['error' => 'Hero not found'], 404);
        }
        return response($hero);
    }

    /**
     * Création d'un hero
     */
    public function create(Request $request)
    {
        $request->validate(['nom' => 'required|max:255', 'joueur' => 'required|max:255']);
        $heros = $request->input();
        $heros['user_id'] = Auth::id();
        $heros = BolHeros::create($heros);
        $this->syncHeroRelations($heros['id'], $request, true);
        return response($heros);
    }

    /**
     * Mise à jour d'un hero
     */
    public function createAdvanced(BolHerosRequest $request)
    {
        $heros = $request->input();
        $heros['user_id'] = Auth::id();
        $heros = BolHeros::create($heros);
        $this->syncHeroRelations($heros['id'], $request, true);
        return response($heros);
    }

    public function updateAdvanced(BolHerosRequest $request)
    {
        return $this->update($request);
    }

    public function update(Request $request)
    {
        $herosId = $request->input('id');

        $data = $request->input();
        $heros['active'] = $data['active'];

        $attributs = $request->input('attributs');
        $heros['vigueur'] = $attributs['vigueur'];
        $heros['agilite'] = $attributs['agilite'];
        $heros['esprit'] = $attributs['esprit'];
        $heros['aura'] = $attributs['aura'];

        $combat = $request->input('combat');
        $heros['initiative'] = $combat['initiative'];
        $heros['melee'] = $combat['melee'];
        $heros['tir'] = $combat['tir'];
        $heros['defense'] = $combat['defense'];

        $origines = $request->input('origines');
        $heros['joueur'] = $origines['joueur'];
        $heros['nom'] = $origines['nom'];
        $heros['region_id'] = $origines['region_id'];
        $heros['avatar'] = $origines['avatar'];
        $heros['commentaire'] = $origines['commentaire'];

        $ressources = $request->input('ressources');
        $heros['vitalite'] = $ressources['vitalite'];
        $heros['heroisme'] = $ressources['heroisme'];
        $heros['foi'] = $ressources['foi'];
        $heros['pouvoir'] = $ressources['pouvoir'];
        $heros['creation'] = $ressources['creation'];

        $hero = BolHeros::where('user_id', Auth::id())->where('id', $herosId)->get()->first();
        if ($hero === null) {
            return response()->json(['error' => 'Hero not found'], 404);
        }
        BolHeros::where('id', $herosId)->update($heros);
        $this->syncHeroRelations($herosId, $request, false);

        $result = $this->bolHerosService->getHeroWithRelations($herosId);
        return response($result);
    }


    /**
     * Remove the specified resource from storage.
     *
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function delete($id): \Illuminate\Http\JsonResponse
    {
        $bolHeros = BolHeros::find($id);
        // Check if the resource exists
        if (!$bolHeros) {
            return response()->json(['message' => 'Hero not found'], Response::HTTP_NOT_FOUND);
        }
        // Delete the resource
        $bolHeros->delete();

        // Return a successful response
        return response()->json(['message' => 'Character deleted successfully'], Response::HTTP_OK);
    }

    public function updateOrigines(Request $request, $herosId)
    {
        $bolHeros = BolHeros::find($herosId);
        // Check if the resource exists
        if (!$bolHeros) {
            return response()->json(['message' => 'Hero not found'], Response::HTTP_NOT_FOUND);
        }
        $bolHeros['avatar'] = $request->input('avatar');
        $bolHeros['joueur'] = $request->input('joueur');
        $bolHeros['nom'] = $request->input('nom');
        $bolHeros['region_id'] = $request->input('region_id');
        $bolHeros->update();
        return response($bolHeros);
    }

    public function adjustHeroisme(Request $request, string $id)
    {
        $heros = $this->bolHerosService->adjustHeroisme($id, Auth::id(), (int) $request->input('delta'));

        if (!$heros) {
            return response()->json(['error' => 'Hero not found'], 404);
        }

        return response()->json($heros);
    }

    private function syncHeroRelations(string $herosId, Request $request, bool $creating): void
    {
        $extractRelationId = static function ($item, string $primaryKey, string $fallbackKey = 'id'): int {
            if (is_numeric($item)) {
                return (int) $item;
            }

            if (!is_array($item)) {
                return 0;
            }

            return (int) ($item[$primaryKey] ?? $item[$fallbackKey] ?? 0);
        };

        $carrieres = $request->input('carrieres', []);
        $carrieres = is_array($carrieres) ? $carrieres : [];
        $carriereIds = array_values(array_map(
            fn ($item) => $extractRelationId($item, 'carriere_id'),
            $carrieres
        ));
        if (!$creating) {
            if (count($carriereIds) === 0) {
                BolHerosCarriere::where('heros_id', $herosId)->delete();
            } else {
                BolHerosCarriere::where('heros_id', $herosId)->whereNotIn('carriere_id', $carriereIds)->delete();
            }
        }
        foreach ($carrieres as $carriere) {
            $carriereId = $extractRelationId($carriere, 'carriere_id');
            if ($carriereId === 0) {
                continue;
            }
            BolHerosCarriere::updateOrCreate(
                ['heros_id' => $herosId, 'carriere_id' => $carriereId],
                ['value' => (int) ($carriere['value'] ?? 0)]
            );
        }

        $armes = $request->input('armes', []);
        $armes = is_array($armes) ? $armes : [];
        $armeIds = array_values(array_map(
            fn ($item) => $extractRelationId($item, 'arme_id'),
            $armes
        ));
        if (!$creating) {
            if (count($armeIds) === 0) {
                BolHerosArme::where('heros_id', $herosId)->delete();
            } else {
                BolHerosArme::where('heros_id', $herosId)->whereNotIn('arme_id', $armeIds)->delete();
            }
        }
        foreach ($armes as $arme) {
            $armeId = $extractRelationId($arme, 'arme_id');
            if ($armeId === 0) {
                continue;
            }
            BolHerosArme::updateOrCreate(['heros_id' => $herosId, 'arme_id' => $armeId], []);
        }

        $armures = $request->input('armures', []);
        $armures = is_array($armures) ? $armures : [];
        $armureIds = array_values(array_map(
            fn ($item) => $extractRelationId($item, 'armure_id'),
            $armures
        ));
        if (!$creating) {
            if (count($armureIds) === 0) {
                BolHerosArmure::where('heros_id', $herosId)->delete();
            } else {
                BolHerosArmure::where('heros_id', $herosId)->whereNotIn('armure_id', $armureIds)->delete();
            }
        }
        foreach ($armures as $armure) {
            $armureId = $extractRelationId($armure, 'armure_id');
            if ($armureId === 0) {
                continue;
            }
            $equipee = is_array($armure) ? (bool) ($armure['equipee'] ?? false) : false;
            BolHerosArmure::updateOrCreate(
                ['heros_id' => $herosId, 'armure_id' => $armureId],
                ['equipee' => $equipee]
            );
        }
        (new BolEquipmentEffectService())->normalizeArmureEquipmentForHeros($herosId);

        $langues = $request->input('langues');
        $origines = $request->input('origines');
        if (
            (!is_array($langues) || count($langues) === 0)
            && is_array($origines)
            && isset($origines['langues'])
            && is_array($origines['langues'])
        ) {
            $langues = $origines['langues'];
        }
        $langues = is_array($langues) ? $langues : [];
        $langueIds = array_values(array_map(
            fn ($item) => $extractRelationId($item, 'langue_id'),
            $langues
        ));
        if (!$creating) {
            if (count($langueIds) === 0) {
                BolHerosLangue::where('heros_id', $herosId)->delete();
            } else {
                BolHerosLangue::where('heros_id', $herosId)->whereNotIn('langue_id', $langueIds)->delete();
            }
        }
        foreach ($langues as $langue) {
            $langueId = $extractRelationId($langue, 'langue_id');
            if ($langueId === 0) {
                continue;
            }
            BolHerosLangue::updateOrCreate(['heros_id' => $herosId, 'langue_id' => $langueId], []);
        }

        $traits = $request->input('traits', []);
        $traits = is_array($traits) ? $traits : [];
        $avantageIds = [];
        $desavantageIds = [];
        foreach ($traits as $trait) {
            $traitId = (int) ($trait['traitable_id'] ?? $trait['id'] ?? 0);
            if ($traitId === 0 || !isset($trait['type'])) {
                continue;
            }
            if ($trait['type'] === 'A') {
                $avantageIds[] = $traitId;
            }
            if ($trait['type'] === 'D') {
                $desavantageIds[] = $traitId;
            }
            BolHerosTrait::updateOrCreate(
                [
                    'heros_id' => $herosId,
                    'traitable_id' => $traitId,
                    'type' => $trait['type'],
                    'traitable_type' => $trait['type'] === 'A' ? BolAvantage::class : BolDesavantage::class,
                ],
                [
                    'detail' => $trait['detail'] ?? null,
                    'region_id' => $trait['region_id'] ?? null,
                    'carriere' => $trait['carriere'] ?? false,
                ]
            );
        }
        if (!$creating) {
            if (count($avantageIds) === 0) {
                BolHerosTrait::where('heros_id', $herosId)->where('type', 'A')->delete();
            } else {
                BolHerosTrait::where('heros_id', $herosId)->where('type', 'A')->whereNotIn('traitable_id', $avantageIds)->delete();
            }
            if (count($desavantageIds) === 0) {
                BolHerosTrait::where('heros_id', $herosId)->where('type', 'D')->delete();
            } else {
                BolHerosTrait::where('heros_id', $herosId)->where('type', 'D')->whereNotIn('traitable_id', $desavantageIds)->delete();
            }
        }
    }

}
