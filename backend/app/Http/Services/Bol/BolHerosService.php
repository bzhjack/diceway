<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolArme;
use App\Models\Bol\BolArmure;
use App\Models\Bol\BolAvantage;
use App\Models\Bol\BolDesavantage;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosArme;
use App\Models\Bol\BolHerosArmure;
use App\Models\Bol\BolHerosCarriere;
use App\Models\Bol\BolHerosLangue;
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

    public function find(string $herosId): ?BolHeros
    {
        return BolHeros::find($herosId);
    }

    public function create(array $input): BolHeros
    {
        $input['user_id'] = Auth::id();
        $heros = BolHeros::create($input);
        $this->syncRelations($heros['id'], $input, true);

        return $heros;
    }

    /** Enregistre la fiche d'un héros du compte ; `null` si ce n'en est pas un. */
    public function update(array $input): ?BolHeros
    {
        $herosId = $input['id'] ?? null;
        $hero = BolHeros::where('user_id', Auth::id())->where('id', $herosId)->first();
        if ($hero === null) {
            return null;
        }

        $attributs = $input['attributs'];
        $combat = $input['combat'];
        $origines = $input['origines'];
        $ressources = $input['ressources'];
        // Par le modèle : c'est lui qui fait un fichier du portrait reçu.
        $hero->update([
            'active' => $input['active'],
            'vigueur' => $attributs['vigueur'],
            'agilite' => $attributs['agilite'],
            'esprit' => $attributs['esprit'],
            'aura' => $attributs['aura'],
            'initiative' => $combat['initiative'],
            'melee' => $combat['melee'],
            'tir' => $combat['tir'],
            'defense' => $combat['defense'],
            'joueur' => $origines['joueur'],
            'nom' => $origines['nom'],
            'region_id' => $origines['region_id'],
            'avatar' => $origines['avatar'],
            'commentaire' => $origines['commentaire'],
            'vitalite' => $ressources['vitalite'],
            'heroisme' => $ressources['heroisme'],
            'foi' => $ressources['foi'],
            'pouvoir' => $ressources['pouvoir'],
            'creation' => $ressources['creation'],
        ]);
        $this->syncRelations($herosId, $input, false);
        app(BolFightSessionService::class)->refreshPnjSnapshots($herosId);

        return $this->getHeroWithRelations($herosId);
    }

    public function updateOrigines(BolHeros $heros, array $input): BolHeros
    {
        $heros['avatar'] = $input['avatar'] ?? null;
        $heros['joueur'] = $input['joueur'] ?? null;
        $heros['nom'] = $input['nom'] ?? null;
        $heros['region_id'] = $input['region_id'] ?? null;
        $heros->update();

        return $heros;
    }

    public function delete(BolHeros $heros): void
    {
        $heros->delete();
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

    private function syncRelations(string $herosId, array $input, bool $creating): void
    {
        $extractRelationId = static function ($item, string $primaryKey, string $fallbackKey = 'id'): int {
            if (is_numeric($item)) {
                return (int) $item;
            }

            if (!is_array($item)) {
                return 0;
            }

            return (int) ($item[$primaryKey] ?? $item[$fallbackKey] ?? 0);
        };

        $carrieres = $input['carrieres'] ?? [];
        $carrieres = is_array($carrieres) ? $carrieres : [];
        $carriereIds = array_values(array_map(
            fn ($item) => $extractRelationId($item, 'carriere_id'),
            $carrieres
        ));
        if (!$creating) {
            if (count($carriereIds) === 0) {
                BolHerosCarriere::where('heros_id', $herosId)->delete();
            } else {
                BolHerosCarriere::where('heros_id', $herosId)->whereNotIn('carriere_id', $carriereIds)->delete();
            }
        }
        foreach ($carrieres as $carriere) {
            $carriereId = $extractRelationId($carriere, 'carriere_id');
            if ($carriereId === 0) {
                continue;
            }
            BolHerosCarriere::updateOrCreate(
                ['heros_id' => $herosId, 'carriere_id' => $carriereId],
                ['value' => (int) ($carriere['value'] ?? 0)]
            );
        }

        $armes = $input['armes'] ?? [];
        $armes = is_array($armes) ? $armes : [];
        $armes = BolAccessibleEquipment::keep(BolArme::class, $armes, fn ($item) => $extractRelationId($item, 'arme_id'));
        $armeIds = array_values(array_map(
            fn ($item) => $extractRelationId($item, 'arme_id'),
            $armes
        ));
        if (!$creating) {
            if (count($armeIds) === 0) {
                BolHerosArme::where('heros_id', $herosId)->delete();
            } else {
                BolHerosArme::where('heros_id', $herosId)->whereNotIn('arme_id', $armeIds)->delete();
            }
        }
        foreach ($armes as $arme) {
            $armeId = $extractRelationId($arme, 'arme_id');
            if ($armeId === 0) {
                continue;
            }
            // L'état « équipée » n'est écrit que s'il est envoyé : un client qui n'envoie que des ids (formulaire
            // avancé) laisse l'état des armes déjà possédées inchangé.
            $attributes = is_array($arme) && array_key_exists('equipee', $arme) ? ['equipee' => (bool) $arme['equipee']] : [];
            BolHerosArme::updateOrCreate(['heros_id' => $herosId, 'arme_id' => $armeId], $attributes);
        }

        $armures = $input['armures'] ?? [];
        $armures = is_array($armures) ? $armures : [];
        $armures = BolAccessibleEquipment::keep(BolArmure::class, $armures, fn ($item) => $extractRelationId($item, 'armure_id'));
        $armureIds = array_values(array_map(
            fn ($item) => $extractRelationId($item, 'armure_id'),
            $armures
        ));
        if (!$creating) {
            if (count($armureIds) === 0) {
                BolHerosArmure::where('heros_id', $herosId)->delete();
            } else {
                BolHerosArmure::where('heros_id', $herosId)->whereNotIn('armure_id', $armureIds)->delete();
            }
        }
        foreach ($armures as $armure) {
            $armureId = $extractRelationId($armure, 'armure_id');
            if ($armureId === 0) {
                continue;
            }
            $equipee = is_array($armure) ? (bool) ($armure['equipee'] ?? false) : false;
            BolHerosArmure::updateOrCreate(
                ['heros_id' => $herosId, 'armure_id' => $armureId],
                ['equipee' => $equipee]
            );
        }
        (new BolEquipmentEffectService())->normalizeArmureEquipmentForHeros($herosId);

        $langues = $input['langues'] ?? null;
        $origines = $input['origines'] ?? null;
        if (
            (!is_array($langues) || count($langues) === 0)
            && is_array($origines)
            && isset($origines['langues'])
            && is_array($origines['langues'])
        ) {
            $langues = $origines['langues'];
        }
        $langues = is_array($langues) ? $langues : [];
        $langueIds = array_values(array_map(
            fn ($item) => $extractRelationId($item, 'langue_id'),
            $langues
        ));
        if (!$creating) {
            if (count($langueIds) === 0) {
                BolHerosLangue::where('heros_id', $herosId)->delete();
            } else {
                BolHerosLangue::where('heros_id', $herosId)->whereNotIn('langue_id', $langueIds)->delete();
            }
        }
        foreach ($langues as $langue) {
            $langueId = $extractRelationId($langue, 'langue_id');
            if ($langueId === 0) {
                continue;
            }
            BolHerosLangue::updateOrCreate(['heros_id' => $herosId, 'langue_id' => $langueId], []);
        }

        $traits = $input['traits'] ?? [];
        $traits = is_array($traits) ? $traits : [];
        $avantageIds = [];
        $desavantageIds = [];
        foreach ($traits as $trait) {
            $traitId = (int) ($trait['traitable_id'] ?? $trait['id'] ?? 0);
            if ($traitId === 0 || !isset($trait['type'])) {
                continue;
            }
            if ($trait['type'] === 'A') {
                $avantageIds[] = $traitId;
            }
            if ($trait['type'] === 'D') {
                $desavantageIds[] = $traitId;
            }
            BolHerosTrait::updateOrCreate(
                [
                    'heros_id' => $herosId,
                    'traitable_id' => $traitId,
                    'type' => $trait['type'],
                    'traitable_type' => $trait['type'] === 'A' ? BolAvantage::class : BolDesavantage::class,
                ],
                [
                    'detail' => $trait['detail'] ?? null,
                    'region_id' => $trait['region_id'] ?? null,
                    'carriere' => $trait['carriere'] ?? false,
                ]
            );
        }
        if (!$creating) {
            if (count($avantageIds) === 0) {
                BolHerosTrait::where('heros_id', $herosId)->where('type', 'A')->delete();
            } else {
                BolHerosTrait::where('heros_id', $herosId)->where('type', 'A')->whereNotIn('traitable_id', $avantageIds)->delete();
            }
            if (count($desavantageIds) === 0) {
                BolHerosTrait::where('heros_id', $herosId)->where('type', 'D')->delete();
            } else {
                BolHerosTrait::where('heros_id', $herosId)->where('type', 'D')->whereNotIn('traitable_id', $desavantageIds)->delete();
            }
        }
    }
}
