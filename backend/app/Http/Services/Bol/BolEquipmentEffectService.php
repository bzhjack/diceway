<?php

namespace App\Http\Services\Bol;

use App\Models\Bol\BolHerosArmure;

/**
 * Calcule les attributs "effectifs" d'un héros (Agilité/Initiative/Défense) en tenant compte du
 * malus d'équipement porté (armure/bouclier/casque). Les méthodes de calcul sont pures (pas
 * d'accès DB) et testables sans base de données — voir tests/Unit/BolEquipmentEffectServiceTest.php.
 * Seule `normalizeArmureEquipmentForHeros()` touche la DB (appelée par BolHerosController et
 * BolPnjController après synchronisation des armures d'un héros/PNJ).
 */
class BolEquipmentEffectService
{
    /**
     * @param array<int, array{categorie: string, malus_agilite: int, malus_initiative: int, malus_attaque_subie: int, malus_attaque_subie_portee: ?string}> $equippedArmures
     */
    public function agiliteEffective(int $agiliteBrute, array $equippedArmures): int
    {
        $malus = array_sum(array_map(fn ($a) => $a['malus_agilite'], $equippedArmures));
        return $agiliteBrute - $malus;
    }

    /**
     * @param array<int, array{categorie: string, malus_agilite: int, malus_initiative: int, malus_attaque_subie: int, malus_attaque_subie_portee: ?string}> $equippedArmures
     */
    public function initiativeEffective(int $initiativeBrute, array $equippedArmures): int
    {
        $malus = array_sum(array_map(fn ($a) => $a['malus_initiative'], $equippedArmures));
        return $initiativeBrute - $malus;
    }

    /**
     * Le malus "-1 à toutes les attaques subies" du grand bouclier équivaut, pour l'attaquant, à
     * un jet réduit de la même valeur — replié directement dans le seuil de défense pour rester
     * automatique côté jet d'attaque (spec, section Backend).
     *
     * @param array<int, array{categorie: string, malus_agilite: int, malus_initiative: int, malus_attaque_subie: int, malus_attaque_subie_portee: ?string}> $equippedArmures
     */
    public function defenseEffective(int $defenseBrute, array $equippedArmures): int
    {
        $bonus = array_sum(array_map(
            fn ($a) => $a['malus_attaque_subie_portee'] === 'toutes' ? $a['malus_attaque_subie'] : 0,
            $equippedArmures,
        ));
        return $defenseBrute + $bonus;
    }

    /**
     * Malus du petit bouclier ("-1 à une attaque subie par round") : ne peut pas être replié
     * automatiquement (l'app ne suit pas de round), exposé tel quel pour que le dialog d'attaque
     * propose une case à cocher manuelle.
     *
     * @param array<int, array{categorie: string, malus_agilite: int, malus_initiative: int, malus_attaque_subie: int, malus_attaque_subie_portee: ?string}> $equippedArmures
     * @return array{bouclier_malus_attaque_subie: int, bouclier_malus_attaque_subie_portee: ?string}
     */
    public function equipementEffectif(array $equippedArmures): array
    {
        foreach ($equippedArmures as $armure) {
            if ($armure['malus_attaque_subie_portee'] === 'une') {
                return [
                    'bouclier_malus_attaque_subie' => $armure['malus_attaque_subie'],
                    'bouclier_malus_attaque_subie_portee' => 'une',
                ];
            }
        }

        return ['bouclier_malus_attaque_subie' => 0, 'bouclier_malus_attaque_subie_portee' => null];
    }

    /**
     * Garantit au plus un élément équipé par catégorie : en cas de conflit (plusieurs `equipee=true`
     * dans la même catégorie), ne garde que celui avec le plus grand id (le plus récemment
     * synchronisé). Fonction pure, appelée après la persistance du payload entrant.
     *
     * @param array<int, array{id: int, categorie: string, equipee: bool}> $rows
     * @return array<int, array{id: int, equipee: bool}> uniquement les lignes dont l'état change
     */
    public function normalizeEquippedFlags(array $rows): array
    {
        $byCategorie = [];
        foreach ($rows as $row) {
            $byCategorie[$row['categorie']][] = $row;
        }

        $changes = [];
        foreach ($byCategorie as $group) {
            $equipped = array_values(array_filter($group, fn ($row) => $row['equipee']));
            if (count($equipped) <= 1) {
                continue;
            }

            $keepId = max(array_column($equipped, 'id'));
            foreach ($equipped as $row) {
                if ($row['id'] !== $keepId) {
                    $changes[] = ['id' => $row['id'], 'equipee' => false];
                }
            }
        }

        return $changes;
    }

    /** Recharge les pivots armure d'un héros/PNJ et applique normalizeEquippedFlags(). */
    public function normalizeArmureEquipmentForHeros(string $herosId): void
    {
        $rows = BolHerosArmure::with('armure')
            ->where('heros_id', $herosId)
            ->get()
            ->filter(fn (BolHerosArmure $item) => $item->armure !== null)
            ->map(fn (BolHerosArmure $item) => [
                'id' => $item->id,
                'categorie' => $item->armure->categorie,
                'equipee' => (bool) $item->equipee,
            ])
            ->values()
            ->all();

        $changes = $this->normalizeEquippedFlags($rows);

        foreach ($changes as $change) {
            BolHerosArmure::where('id', $change['id'])->update(['equipee' => $change['equipee']]);
        }
    }
}
