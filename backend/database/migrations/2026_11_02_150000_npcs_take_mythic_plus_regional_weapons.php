<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Migrations\Migration;

/** Les PNJ du livre passent aux armes régionales de Mythic+ : l'arc long de Tyrus, le khastok et le kriss du livre de base sont devenus des
 * armes à part (`2026_10_19_100000_add_mythic_plus_reference_data`). L'assassin halakhi garde sa dague pour ses couteaux de lancer. Seuls
 * les PNJ du catalogue (`user_id` nul) changent ; le seeder porte les mêmes armes. Armes et PNJ sont retrouvés par leur nom. */
return new class extends Migration
{
    /** PNJ => [arme remplacée (null : on ajoute), arme régionale]. */
    private const BASCULES = [
        'Archer de Tyrus' => ['Arc', 'Arc de guerre de Tyrus'],
        'Assassin halakhi' => [null, 'Kriss'],
        'Garde jemadar' => ['Arme d’hast', 'Khastok'],
    ];

    public function up(): void
    {
        foreach (self::BASCULES as $pnj => [$ancienne, $nouvelle]) {
            $this->basculer($pnj, $ancienne, $nouvelle);
        }
    }

    public function down(): void
    {
        foreach (self::BASCULES as $pnj => [$ancienne, $nouvelle]) {
            $this->basculer($pnj, $nouvelle, $ancienne);
        }
    }

    /** Remplace l'arme `$de` du PNJ par `$vers` ; sans `$de`, ajoute `$vers` ; sans `$vers`, retire `$de`. */
    private function basculer(string $pnj, ?string $de, ?string $vers): void
    {
        $herosId = DB::table('bol_heros')->whereNull('user_id')->where('type', '!=', 'H')->where('nom', $pnj)->value('id');
        $deId = $de === null ? null : DB::table('bol_arme')->where('arme', $de)->value('id');
        $versId = $vers === null ? null : DB::table('bol_arme')->where('arme', $vers)->value('id');
        if ($herosId === null || ($de !== null && $deId === null) || ($vers !== null && $versId === null)) {
            return;
        }

        $armes = DB::table('bol_heros_arme')->where('heros_id', $herosId);
        if ($versId !== null && (clone $armes)->where('arme_id', $versId)->exists()) {
            return;
        }
        if ($deId === null) {
            DB::table('bol_heros_arme')->insert(['heros_id' => $herosId, 'arme_id' => $versId, 'equipee' => true, 'created_at' => now(), 'updated_at' => now()]);
        } elseif ($versId === null) {
            (clone $armes)->where('arme_id', $deId)->delete();
        } else {
            (clone $armes)->where('arme_id', $deId)->update(['arme_id' => $versId, 'updated_at' => now()]);
        }
    }
};
