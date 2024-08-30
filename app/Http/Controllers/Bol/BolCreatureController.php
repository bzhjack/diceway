<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolCreature;
use App\Models\Bol\BolTaille;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BolCreatureController extends Controller
{
    public function getAll()
    {
        $creatures = BolCreature::with('taille', 'capacites.capacite')->where('user_id', Auth::id())->orWhereNull('user_id')->orderBy('nom', 'asc')->get();
        return response($creatures);
    }

    public function getAllTailles()
    {
        $tailles = BolTaille::orderBy('id', 'asc')->get();
        return response($tailles);
    }

    public function create(Request $request)
    {
        $creature = $request->input();
        $creature['user_id'] = Auth::id();
        $creature = BolCreature::create($creature);
        return response($creature);
    }

    public function update(Request $request)
    {
        $creatureId = $request->input('id');
        $updatedCreature = $request->except(['capacites']);

        $creature = BolCreature::where('user_id', Auth::id())->where('id', $creatureId)->get()->first();
        if ($creature === null) {
            return response()->json(['error' => 'Creature not found'], 404);
        }
        BolCreature::where('id', $creatureId)->update($updatedCreature);
        $result = BolCreature::with('taille', 'capacites.capacite')->where('user_id', Auth::id())->where('id', $creatureId)->get()->first();
        return response($result);
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
