<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosTrait;
use Illuminate\Support\Facades\Auth;

class BolHerosService
{
    public function getHeroWithRelations($herosId)
    {
        return BolHeros::with($this->heroRelations())
            ->where('id', $herosId)
            ->first();
    }
    public function getHeroesWithRelations()
    {
        return BolHeros::with($this->heroRelations())
            ->where('type', 'H')
            ->where('user_id', Auth::id())
            ->get();
    }

    private function heroRelations()
    {
        return [
            'traits.traitable',
            'carrieres.carriere',
            'armures.armure',
            'armes.arme',
            'langues.langue',
            'region',
        ];
    }

    /** Ajuste l'héroïsme d'un héros (delta positif ou négatif), borné à 0 minimum. */
    public function adjustHeroisme(string $herosId, string $userId, int $delta): ?BolHeros
    {
        $heros = BolHeros::where('id', $herosId)->where('user_id', $userId)->first();
        if (!$heros) {
            return null;
        }

        $heros->update(['heroisme' => max(0, $heros->heroisme + $delta)]);

        return $heros->fresh();
    }

    /** Avantage « Arme favorite » (bol_avantage.id). */
    private const AVANTAGE_ARME_FAVORITE = 6;

    /** Le nom d'une arme favorite tel qu'il s'enregistre : sans espaces autour ; un nom vide retire l'arme. */
    public static function precisionArmeFavorite(?string $arme): ?string
    {
        $nom = trim((string) $arme);

        return $nom === '' ? null : mb_substr($nom, 0, 120);
    }

    /**
     * Nomme l'arme favorite d'une fiche (héros ou PNJ) : la précision de son avantage général « Arme favorite ». L'arme d'un avantage
     * régional est imposée par la région et ne change pas. Null si la fiche ou l'avantage est introuvable ; false s'il est régional.
     */
    public function designerArmeFavorite(string $herosId, string $userId, ?string $arme): BolHeros|false|null
    {
        $heros = BolHeros::where('id', $herosId)->where('user_id', $userId)->first();
        $trait = $heros
            ? BolHerosTrait::where('heros_id', $herosId)->where('type', 'A')->where('traitable_id', self::AVANTAGE_ARME_FAVORITE)->first()
            : null;
        if (!$trait) {
            return null;
        }
        if ($trait->region_id !== null) {
            return false;
        }

        $trait->update(['detail' => self::precisionArmeFavorite($arme)]);

        return $this->getHeroWithRelations($herosId);
    }
}
