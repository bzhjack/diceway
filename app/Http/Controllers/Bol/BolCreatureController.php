<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolCapacite;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolCreatureCapacite;
use App\Models\Bol\BolTaille;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BolCreatureController extends Controller
{
    public function getAll()
    {
        $creatures = BolCreature::with('taille', 'capacites.capacite')
            ->where('user_id', Auth::id())
            ->orWhereNull('user_id')
            ->orderBy('nom', 'asc')->get();
        return response($creatures);
    }

    public function getAllTailles()
    {
        $tailles = BolTaille::orderBy('id', 'asc')->get();
        return response($tailles);
    }

    public function getAllCapacites()
    {
        $capacites = BolCapacite::orderBy('id', 'asc')->get();
        return response($capacites);
    }

    public function create(Request $request)
    {
        $creature = $request->input();
        $creature['user_id'] = Auth::id();
        $creature = BolCreature::create($creature);
        $capacites = $request->input('capacites');
        foreach ($capacites as $capacite) {
            $newcapa['creature_id'] = $creature['id'];
            $newcapa['capacite_id'] = $capacite['id'];
            $newcapa['detail'] = $capacite['detail'];
            BolCreatureCapacite::create($newcapa);
        }
        $createdCreature = BolCreature::with('taille', 'capacites.capacite')
            ->where('user_id', Auth::id())
            ->where('id', $creature['id'])->get()->first();
        return response($createdCreature);
    }

    public function update(Request $request)
    {
        $creatureId = $request->input('id');
        $updatedCreature = $request->except(['capacites']);
        $creature = BolCreature::with('taille', 'capacites')
            ->where('user_id', Auth::id())
            ->where('id', $creatureId)->get()->first();

        // Le nouveau tableau de capacités venant de la requête
        $tableau2 = $request->input('capacites');
        $ids_tableau2 = array_column($tableau2, 'id');

        // Supprimer les capacités qui ne sont plus associées à la créature
        BolCreatureCapacite::whereNotIn('capacite_id', $ids_tableau2)
            ->where('creature_id', $creatureId)
            ->delete();

        // Mettre à jour ou insérer les nouvelles capacités
        foreach ($tableau2 as $item) {
            BolCreatureCapacite::updateOrCreate(
                [
                    'creature_id' => $creatureId,
                    'capacite_id' => $item['id']
                ],
                [
                    'detail' => $item['detail']
                ]
            );
        }

        // Mettre à jour les autres champs de la créature
        $creature->update($updatedCreature);

        return response()->json(['message' => 'Creature updated successfully']);
    }

    public function delete($id): \Illuminate\Http\JsonResponse
    {
        $bolCreature = BolCreature::find($id);
        // Check if the resource exists
        if (!$bolCreature) {
            return response()->json(['message' => 'Creature not found'], Response::HTTP_NOT_FOUND);
        }
        // Delete the resource
        $bolCreature->delete();
        // Return a successful response
        return response()->json(['message' => 'Creature deleted successfully'], Response::HTTP_OK);
    }
}
