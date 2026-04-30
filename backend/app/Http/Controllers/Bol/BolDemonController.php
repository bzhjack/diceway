<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Http\Services\Bol\BolDemonService;
use App\Models\Bol\BolCategorie;
use App\Models\Bol\BolDemon;
use App\Models\Bol\BolDemonPouvoir;
use App\Models\Bol\BolPouvoir;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

class BolDemonController extends Controller
{

    protected $bolDemonService;

    public function __construct(BolDemonService $bolDemonService)
    {
        $this->bolDemonService = $bolDemonService;
    }

    public function getAll()
    {
        $cacheKey = 'bol_demons';
        $cacheDuration = 60 * 24; // 60 minutes
        $demon = Cache::remember($cacheKey, $cacheDuration, function () {
            return $this->bolDemonService->getDemonsWithRelations();
        });
        return response($demon);
    }

    /**
     * Récupère une créature par son id
     */
    public function getOne(Request $request)
    {
        $id = $request->route('id');
        $Demon = $this->bolDemonService->getDemonWithRelations($id);
        if ($Demon === null) {
            return response()->json(['error' => 'Demon not found'], 404);
        }
        return response($Demon);
    }

    public function getAllCategories()
    {
        $cacheKey = 'bol_demons_categories';
        $cacheDuration = 60 * 24; // 60 minutes
        $categorie = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolCategorie::orderBy('id', 'asc')->get();
        });
        return response($categorie);
    }

    public function getAllPouvoirs()
    {
        $cacheKey = 'bol_demon_pouvoirs';
        $cacheDuration = 60 * 24; // 60 minutes
        $pouvoirs = Cache::remember($cacheKey, $cacheDuration, function () {
            return BolPouvoir::orderBy('id', 'asc')->get();
        });
        return response($pouvoirs);
    }

    public function create(Request $request)
    {
        Cache::forget('bol_demons');
        $demon = $request->input();
        $demon['user_id'] = Auth::id();
        $demon = BolDemon::create($demon);
        $pouvoirs = $request->input('pouvoirs');
        foreach ($pouvoirs as $pouvoir) {
            $newPower['demon_id'] = $demon['id'];
            $newPower['pouvoir_id'] = $pouvoir['id'];
            $newPower['detail'] = $pouvoir['detail'];
            BolDemonPouvoir::create($newPower);
        }
        $createdDemon = BolDemon::with('categorie', 'pouvoirs.pouvoir')
            ->where('user_id', Auth::id())
            ->where('id', $demon['id'])->get()->first();
        return response($createdDemon);
    }

    public function update(Request $request)
    {
        Cache::forget('bol_demons');
        $demonId = $request->input('id');
        $updatedDemon = $request->except(['pouvoirs']);
        $demon = BolDemon::with('categorie', 'pouvoirs')
            ->where('user_id', Auth::id())
            ->where('id', $demonId)->get()->first();

        // Le nouveau tableau de capacités venant de la requête
        $tableau2 = $request->input('pouvoirs');
        $ids_tableau2 = array_column($tableau2, 'id');

        // Supprimer les capacités qui ne sont plus associées à la créature
        BolDemonPouvoir::whereNotIn('pouvoir_id', $ids_tableau2)
            ->where('demon_id', $demonId)
            ->delete();

        // Mettre à jour ou insérer les nouvelles capacités
        foreach ($tableau2 as $item) {
            BolDemonPouvoir::updateOrCreate(
                [
                    'demon_id' => $demonId,
                    'pouvoir_id' => $item['id']
                ],
                [
                    'detail' => $item['detail']
                ]
            );
        }

        // Mettre à jour les autres champs de la créature
        $demon->update($updatedDemon);
        return response($this->bolDemonService->getDemonWithRelations($demonId));
    }

    public function delete($id): \Illuminate\Http\JsonResponse
    {
        Cache::forget('bol_demons');
        $bolDemon = BolDemon::find($id);
        // Check if the resource exists
        if (!$bolDemon) {
            return response()->json(['message' => 'Demon not found'], Response::HTTP_NOT_FOUND);
        }
        // Delete the resource
        $bolDemon->delete();
        // Return a successful response
        return response()->json(['message' => 'Demon deleted successfully'], Response::HTTP_OK);
    }
}
