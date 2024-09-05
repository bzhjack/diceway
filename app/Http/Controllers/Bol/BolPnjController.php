<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosArme;
use App\Models\Bol\BolHerosArmure;
use App\Models\Bol\BolHerosCarriere;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class BolPnjController extends Controller
{
    /**
     * Récupère tout les pnj
     */
    public function getAll()
    {
        $heroes = BolHeros::with('carrieres.carriere', 'armures.armure', 'armes.arme', 'langues.langue')
            ->where('user_id', Auth::id())
            ->where('type', '!=', 'H')
            ->get();
        return response($heroes);
    }

    public function create(Request $request)
    {
        $pnj = $request->input();
        $pnj['user_id'] = Auth::id();
        $pnj = BolHeros::create($pnj);
        $armes = $request->input('armes');
        foreach ($armes as $arme) {
            $newarme['heros_id'] = $pnj['id'];
            $newarme['arme_id'] = $arme['id'];
            BolHerosArme::create($newarme);
        }
        $armures = $request->input('armures');
        foreach ($armures as $armure) {
            $newarmure['heros_id'] = $pnj['id'];
            $newarmure['armure_id'] = $armure['id'];
            BolHerosArmure::create($newarmure);
        }
        $carrieres = $request->input('carrieres');
        foreach ($carrieres as $carriere) {
            $newcarriere['heros_id'] = $pnj['id'];
            $newcarriere['carriere_id'] = $carriere['id'];
            $newcarriere['value'] = $carriere['value'];
            BolHerosCarriere::create($newcarriere);
        }
        $createdCreature = BolHeros::with('carrieres.carriere', 'armures.armure', 'armes.arme')
            ->where('user_id', Auth::id())
            ->where('id', $pnj['id'])->get()->first();
        return response($createdCreature);
    }


    public function update(Request $request)
    {
        $pnjId = $request->input('id');
        $updatedPnj = $request->except(['armes', 'armures', 'carrieres']);
        $pnj = BolHeros::with('carrieres.carriere', 'armures.armure', 'armes.arme')->where('user_id', Auth::id())->where('id', $pnjId)->get()->first();

        $carrieres = $request->input('carrieres');
        $ids_carrieres = array_column($carrieres, 'id');
        BolHerosCarriere::whereNotIn('carriere_id', $ids_carrieres)->where('heros_id', $pnjId)->delete();
        foreach ($carrieres as $item) {
            BolHerosCarriere::updateOrCreate(['heros_id' => $pnjId, 'carriere_id' => $item['id']], ['value' => $item['value']]);
        }

        $armes = $request->input('armes');
        $ids_armes = array_column($armes, 'id');
        BolHerosArme::whereNotIn('arme_id', $ids_armes)->where('heros_id', $pnjId)->delete();
        foreach ($armes as $item) {
            BolHerosArme::updateOrCreate(['heros_id' => $pnjId, 'arme_id' => $item['id']],[]);
        }

        $armures = $request->input('armures');
        $ids_armures = array_column($armures, 'id');
        BolHerosArmure::whereNotIn('armure_id', $ids_armures)->where('heros_id', $pnjId)->delete();
        foreach ($armures as $item) {
            BolHerosArmure::updateOrCreate(['heros_id' => $pnjId, 'armure_id' => $item['id']],[]);
        }

        $pnj->update($updatedPnj);
        return response()->json(['message' => 'Pnj updated successfully']);
    }


    public function delete($id): JsonResponse
    {
        $bolPnj = BolHeros::find($id);
        if (!$bolPnj) {
            return response()->json(['message' => 'Pnj not found'], Response::HTTP_NOT_FOUND);
        }
        $bolPnj->delete();
        return response()->json(['message' => 'Pnj deleted successfully'], Response::HTTP_OK);
    }
}
