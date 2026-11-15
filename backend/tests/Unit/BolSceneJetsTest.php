<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolSceneJets;
use PHPUnit\Framework\TestCase;

/** Les jets d'une scène, nettoyés avant d'être écrits : la saisie de « Préparer la scène » et l'import des scénarios. */
class BolSceneJetsTest extends TestCase
{
    private const COQUILLAGE = [
        'titre'      => 'Coquillage',
        'attributs'  => ['vigueur'],
        'difficulte' => 'ardue',
        'enjeu'      => 'dégager sa jambe',
        'echec'      => 'le pied reste pris',
        'reussite'   => null,
        'carriere'   => null,
        'quand'      => null,
    ];

    public function test_un_jet_complet_est_garde_tel_quel(): void
    {
        $complet = [...self::COQUILLAGE, 'reussite' => 'libre', 'carriere' => 'Marin', 'quand' => 'à la sortie'];

        $this->assertSame([$complet], BolSceneJets::nettoyer([$complet]));
    }

    public function test_les_textes_vides_deviennent_null_et_sont_rognes(): void
    {
        $jets = BolSceneJets::nettoyer([[
            'titre'     => '  Coquillage  ',
            'attributs' => ['vigueur'],
            'enjeu'     => '   ',
            'echec'     => str_repeat('é', 400),
        ]]);

        $this->assertSame('Coquillage', $jets[0]['titre']);
        $this->assertNull($jets[0]['enjeu']);
        $this->assertSame(BolSceneJets::TEXTE_MAX, mb_strlen($jets[0]['echec']));
        $this->assertNull($jets[0]['quand']);
        $this->assertSame(['titre', 'attributs', 'difficulte', 'enjeu', 'echec', 'reussite', 'carriere', 'quand'], array_keys($jets[0]));
    }

    public function test_un_titre_trop_long_est_coupe(): void
    {
        $jets = BolSceneJets::nettoyer([['titre' => str_repeat('a', 200)]]);

        $this->assertSame(BolSceneJets::TITRE_MAX, mb_strlen($jets[0]['titre']));
    }

    public function test_un_jet_sans_titre_est_retire(): void
    {
        $jets = BolSceneJets::nettoyer([['titre' => '  ', 'attributs' => ['vigueur']], 'pas un jet', self::COQUILLAGE]);

        $this->assertSame([self::COQUILLAGE], $jets);
    }

    public function test_attributs_inconnus_retires_dedoublonnes_deux_au_plus(): void
    {
        $jets = BolSceneJets::nettoyer([['titre' => 'Algues', 'attributs' => ['esprit', 'melee', 'esprit', 'vigueur', 'aura']]]);

        $this->assertSame(['esprit', 'vigueur'], $jets[0]['attributs']);
    }

    public function test_un_effet_sans_jet_garde_une_liste_vide(): void
    {
        $jets = BolSceneJets::nettoyer([['titre' => 'Poissons volants', 'echec' => 'd3 dégâts']]);

        $this->assertSame([], $jets[0]['attributs']);
    }

    public function test_difficulte_inconnue_ou_absente_devient_moyenne(): void
    {
        $jets = BolSceneJets::nettoyer([['titre' => 'A', 'difficulte' => 'ardu'], ['titre' => 'B'], ['titre' => 'C', 'difficulte' => 'heroique']]);

        $this->assertSame(['moyenne', 'moyenne', 'heroique'], array_column($jets, 'difficulte'));
    }

    public function test_vingt_jets_au_plus(): void
    {
        $jets = BolSceneJets::nettoyer(array_fill(0, 25, self::COQUILLAGE));

        $this->assertCount(BolSceneJets::JETS_MAX, $jets);
    }

    public function test_aucun_jet_rend_null(): void
    {
        $this->assertNull(BolSceneJets::nettoyer([]));
        $this->assertNull(BolSceneJets::nettoyer(null));
        $this->assertNull(BolSceneJets::nettoyer([['titre' => '']]));
    }

    public function test_les_difficultes_suivent_l_echelle_du_livre(): void
    {
        $this->assertSame(
            ['tres-facile' => 2, 'facile' => 1, 'moyenne' => 0, 'ardue' => -1, 'difficile' => -2, 'tres-difficile' => -4, 'impossible' => -6, 'heroique' => -8],
            BolSceneJets::DIFFICULTES,
        );
    }
}
