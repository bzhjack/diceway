<?php

use App\Http\Services\Bol\BolSceneDistribution;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Une entrée de distribution par personnage : l'import (un PNJ par entrée) et « Enregistrer la table comme scène » (une entrée
 * par ligne de la table) donnaient autant d'entrées d'un exemplaire que de copies ; les entrées de la même fiche, du même camp
 * et de la même attitude n'en font plus qu'une, avec leur nombre d'exemplaires (`BolSceneDistribution::regroupee`). La table
 * assied le même nombre de personnages : rien à défaire.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('bol_scene')->whereNotNull('distribution')->orderBy('id')->each(function (object $scene): void {
            $entries = json_decode((string) $scene->distribution, true);
            if (!is_array($entries)) {
                return;
            }
            $normalisees = array_map(static fn (array $e): array => [
                'kind'      => (string) ($e['kind'] ?? ''),
                'source_id' => (string) ($e['source_id'] ?? ''),
                'qty'       => max(1, (int) ($e['qty'] ?? 1)),
                'camp'      => BolSceneDistribution::entryCamp($e),
                'attitude'  => BolSceneDistribution::entryAttitude($e),
            ], array_values(array_filter($entries, 'is_array')));
            $regroupees = BolSceneDistribution::regroupee($normalisees);
            if (count($regroupees) !== count($entries)) {
                DB::table('bol_scene')->where('id', $scene->id)->update(['distribution' => json_encode($regroupees)]);
            }
        });
    }

    public function down(): void
    {
    }
};
