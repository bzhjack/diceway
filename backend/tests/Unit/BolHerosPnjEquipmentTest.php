<?php

namespace Tests\Unit;

use App\Models\Bol\BolArmure;
use App\Models\Bol\BolHeros;
use App\Models\Bol\BolHerosArmure;
use PHPUnit\Framework\TestCase;

/**
 * Un PNJ porte tout ce qu'il possède : ses valeurs effectives tiennent compte de toutes ses armures, équipées ou non.
 * Un héros, lui, ne subit que ce qu'il a équipé. Les relations sont posées en mémoire : aucune base n'est requise.
 */
class BolHerosPnjEquipmentTest extends TestCase
{
    private function piece(string $categorie, bool $equipee, int $malusAgilite = 0, int $malusInitiative = 0, int $malusAttaqueSubie = 0, ?string $portee = null): BolHerosArmure
    {
        $armure = new BolArmure();
        $armure->forceFill([
            'categorie' => $categorie,
            'malus_agilite' => $malusAgilite,
            'malus_initiative' => $malusInitiative,
            'malus_attaque_subie' => $malusAttaqueSubie,
            'malus_attaque_subie_portee' => $portee,
        ]);

        $piece = new BolHerosArmure();
        $piece->forceFill(['equipee' => $equipee]);
        $piece->setRelation('armure', $armure);

        return $piece;
    }

    /** Armure moyenne, casque et petit bouclier, tous « non équipés » en base (le cas des PNJ du catalogue). */
    private function personnage(string $type): BolHeros
    {
        $personnage = new BolHeros();
        $personnage->forceFill(['type' => $type, 'agilite' => 1, 'initiative' => 1, 'defense' => 1]);
        $personnage->setRelation('armures', collect([
            $this->piece('armure', false, malusAgilite: 1),
            $this->piece('casque', false, malusInitiative: 1),
            $this->piece('bouclier', false, malusAttaqueSubie: 1, portee: 'une'),
        ]));

        return $personnage;
    }

    public function test_un_pnj_est_reconnu_a_son_type(): void
    {
        foreach (['P', 'C', 'R'] as $type) {
            $this->assertTrue($this->personnage($type)->isPnj());
        }
        $this->assertFalse($this->personnage('H')->isPnj());
    }

    public function test_un_pnj_subit_les_effets_de_toutes_ses_armures_meme_non_equipees(): void
    {
        $pnj = $this->personnage('C');

        $this->assertSame(0, $pnj->agilite_effective);
        $this->assertSame(0, $pnj->initiative_effective);
        $this->assertSame(1, $pnj->equipement_effectif['bouclier_malus_attaque_subie']);
        $this->assertSame('une', $pnj->equipement_effectif['bouclier_malus_attaque_subie_portee']);
    }

    public function test_un_grand_bouclier_entre_dans_la_defense_d_un_pnj(): void
    {
        $pnj = $this->personnage('R');
        $pnj->setRelation('armures', collect([$this->piece('bouclier', false, malusAgilite: 1, malusAttaqueSubie: 1, portee: 'toutes')]));

        $this->assertSame(2, $pnj->defense_effective);
        $this->assertSame(1, $pnj->equipement_effectif['bouclier_defense_toutes']);
    }

    public function test_un_heros_ne_subit_que_ce_qu_il_a_equipe(): void
    {
        $heros = $this->personnage('H');

        $this->assertSame(1, $heros->agilite_effective);
        $this->assertSame(1, $heros->initiative_effective);
        $this->assertSame(0, $heros->equipement_effectif['bouclier_malus_attaque_subie']);
    }
}
