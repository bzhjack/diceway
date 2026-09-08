<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolEquipmentEffectService;
use PHPUnit\Framework\TestCase;

class BolEquipmentEffectServiceTest extends TestCase
{
    private function armure(string $categorie, int $malusAgilite = 0, int $malusInitiative = 0, int $malusAttaqueSubie = 0, ?string $portee = null): array
    {
        return [
            'categorie' => $categorie,
            'malus_agilite' => $malusAgilite,
            'malus_initiative' => $malusInitiative,
            'malus_attaque_subie' => $malusAttaqueSubie,
            'malus_attaque_subie_portee' => $portee,
        ];
    }

    public function test_agilite_effective_without_equipment_returns_raw_value(): void
    {
        $service = new BolEquipmentEffectService();
        $this->assertSame(8, $service->agiliteEffective(8, []));
    }

    public function test_agilite_effective_applies_armure_moyenne_malus(): void
    {
        $service = new BolEquipmentEffectService();
        $this->assertSame(7, $service->agiliteEffective(8, [$this->armure('armure', malusAgilite: 1)]));
    }

    public function test_agilite_effective_combines_armure_and_grand_bouclier_malus(): void
    {
        $service = new BolEquipmentEffectService();
        $equipped = [
            $this->armure('armure', malusAgilite: 2),
            $this->armure('bouclier', malusAgilite: 1, malusAttaqueSubie: 1, portee: 'toutes'),
        ];
        $this->assertSame(5, $service->agiliteEffective(8, $equipped));
    }

    public function test_initiative_effective_applies_casque_malus(): void
    {
        $service = new BolEquipmentEffectService();
        $this->assertSame(3, $service->initiativeEffective(4, [$this->armure('casque', malusInitiative: 1)]));
    }

    public function test_defense_effective_applies_grand_bouclier_bonus(): void
    {
        $service = new BolEquipmentEffectService();
        $equipped = [$this->armure('bouclier', malusAgilite: 1, malusAttaqueSubie: 1, portee: 'toutes')];
        $this->assertSame(9, $service->defenseEffective(8, $equipped));
    }

    public function test_defense_effective_ignores_petit_bouclier_malus(): void
    {
        $service = new BolEquipmentEffectService();
        $equipped = [$this->armure('bouclier', malusAttaqueSubie: 1, portee: 'une')];
        $this->assertSame(8, $service->defenseEffective(8, $equipped));
    }

    public function test_equipement_effectif_exposes_petit_bouclier_malus(): void
    {
        $service = new BolEquipmentEffectService();
        $equipped = [$this->armure('bouclier', malusAttaqueSubie: 1, portee: 'une')];
        $this->assertSame(
            ['bouclier_malus_attaque_subie' => 1, 'bouclier_malus_attaque_subie_portee' => 'une'],
            $service->equipementEffectif($equipped),
        );
    }

    public function test_equipement_effectif_returns_zero_without_petit_bouclier(): void
    {
        $service = new BolEquipmentEffectService();
        $this->assertSame(
            ['bouclier_malus_attaque_subie' => 0, 'bouclier_malus_attaque_subie_portee' => null],
            $service->equipementEffectif([]),
        );
    }

    public function test_normalize_equipped_flags_keeps_highest_id_per_categorie(): void
    {
        $service = new BolEquipmentEffectService();
        $rows = [
            ['id' => 10, 'categorie' => 'armure', 'equipee' => true],
            ['id' => 12, 'categorie' => 'armure', 'equipee' => true],
        ];
        $this->assertSame([['id' => 10, 'equipee' => false]], $service->normalizeEquippedFlags($rows));
    }

    public function test_normalize_equipped_flags_returns_empty_when_no_conflict(): void
    {
        $service = new BolEquipmentEffectService();
        $rows = [
            ['id' => 10, 'categorie' => 'armure', 'equipee' => true],
            ['id' => 11, 'categorie' => 'bouclier', 'equipee' => true],
        ];
        $this->assertSame([], $service->normalizeEquippedFlags($rows));
    }
}
