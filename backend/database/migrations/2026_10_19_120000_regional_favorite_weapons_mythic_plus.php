<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/** L'arme favorite régionale (avantage « Arme favorite » proposé par une région) nomme l'arme du livre, devenue une arme à part avec
 * la mise à jour Mythic+ : kriss, khastok, fronde de l'Axos, hache d'abordage de Parsool, arc de guerre de Tyrus, épée valgardienne
 * (origines du livre, doc/pdf-text/01-creation-p12-55.txt ; doc/pdf-text/07-maj-mythic-plus.txt). Elle était rattachée à l'arme de base (dague, arme d'hast…). Les héros
 * qui l'ont déjà reçue de leur région suivent ; une précision changée à la main n'est pas touchée. */
return new class extends Migration
{
    private const ARME_FAVORITE = 6;

    /** région => [avant, après] */
    private const ARMES = [
        3 => ['Dague', 'Kriss'],                                     // Halakh
        7 => ['Arme d’hast', 'Khastok'],                             // Malakut
        10 => ['Fronde / bâton-fronde', 'Fronde de l’Axos'],         // Montagnes de l'Axos
        12 => ['Hache', 'Hache d’abordage de Parsool'],              // Parsool
        17 => ['Arc', 'Arc de guerre de Tyrus'],                     // Tyrus
        19 => ['Épée', 'Épée valgardienne'],                         // Valgard
    ];

    public function up(): void
    {
        foreach (self::ARMES as $regionId => [$avant, $apres]) {
            $this->remplacer($regionId, $avant, $apres);
        }
        Cache::forget('bol_regions_all');
    }

    public function down(): void
    {
        foreach (self::ARMES as $regionId => [$avant, $apres]) {
            $this->remplacer($regionId, $apres, $avant);
        }
        Cache::forget('bol_regions_all');
    }

    private function remplacer(int $regionId, string $de, string $vers): void
    {
        DB::table('bol_region_avantage')
            ->where('region_id', $regionId)
            ->where('avantage_id', self::ARME_FAVORITE)
            ->where('detail', $de)
            ->update(['detail' => $vers]);
        DB::table('bol_heros_trait')
            ->where('type', 'A')
            ->where('traitable_id', self::ARME_FAVORITE)
            ->where('region_id', $regionId)
            ->where('detail', $de)
            ->update(['detail' => $vers]);
    }
};
