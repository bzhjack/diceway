<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolDesavantage;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosArme;
use App\Models\Bol\BolHerosArmure;
use App\Models\Bol\BolHerosCarriere;
use App\Models\Bol\BolHerosTrait;
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
        $heroes = BolHeros::with('traits.traitable', 'carrieres.carriere', 'armures.armure', 'armes.arme', 'langues.langue')
            ->where('type', '!=', 'H')
            ->where('user_id', Auth::id())
            ->orWhereNull('user_id')
            ->orderBy('user_id', 'desc')
            ->orderBy('nom')
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

        $traits = $request->input('traits');
        foreach ($traits as $trait) {
            $newTrait['heros_id'] = $pnj['id'];
            $newTrait['traitable_id'] = $trait['id'];
            $newTrait['type'] = $trait['type'];
            $newTrait['traitable_type'] = $trait['type'] == 'A' ? BolAvantage::class : BolDesavantage::class;
            BolHerosTrait::create($newTrait);
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


        $traits = $request->input('traits');

        $traits_type_a = array_filter($traits, function($trait) { return $trait['type'] === 'A'; });
        $ids_avantages = array_column($traits_type_a, 'id');
        BolHerosTrait::whereNotIn('traitable_id', $ids_avantages)->where('type', 'A')->where('heros_id', $pnjId)->delete();

        $traits_type_d = array_filter($traits, function($trait) { return $trait['type'] === 'D'; });
        $ids_desavantages = array_column($traits_type_d, 'id');
        BolHerosTrait::whereNotIn('traitable_id', $ids_desavantages)->where('type', 'D')->where('heros_id', $pnjId)->delete();

        foreach ($traits as $item) {
            BolHerosTrait::updateOrCreate(
                [
                    'heros_id' => $pnjId,
                    'traitable_id' => $item['id'],
                    'type' => $item['type'],
                    'traitable_type' =>  $item['type'] == 'A' ? BolAvantage::class : BolDesavantage::class
                ],[]);
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
