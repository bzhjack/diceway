<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolHeros;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
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
        /*$armes = $request->input('capacites');
        foreach ($capacites as $capacite) {
            $newcapa['creature_id'] = $creature['id'];
            $newcapa['capacite_id'] = $capacite['id'];
            $newcapa['detail'] = $capacite['detail'];
            BolCreatureCapacite::create($newcapa);
        }*/
        $createdCreature = BolHeros::with('carrieres.carriere', 'armures.armure', 'armes.arme', 'langues.langue')
            ->where('user_id', Auth::id())
            ->where('id', $pnj['id'])->get()->first();
        return response($createdCreature);
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
