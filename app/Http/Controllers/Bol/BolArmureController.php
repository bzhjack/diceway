<?php

namespace App\Http\Controllers\Bol;

use App\Http\Controllers\Controller;
use App\Models\Bol\BolHerosArmure;
use Illuminate\Http\Request;
use App\Models\Bol\BolArmure;

class BolArmureController extends Controller
{
    public function getAll()
    {
        $donnees = BolArmure::all();
        return response()->json($donnees);
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
}
