<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolTitreChapitre;
use PHPUnit\Framework\TestCase;

class BolTitreChapitreTest extends TestCase
{
    public function test_splits_a_numbered_chapter_from_its_scenario(): void
    {
        $this->assertSame(
            ['saga' => 'Perle du Beshaar', 'numero' => 1, 'titre' => 'Sacrilège à Satarla'],
            BolTitreChapitre::decouper('Perle du Beshaar — 1. Sacrilège à Satarla'),
        );
        $this->assertSame(10, BolTitreChapitre::decouper('Perle du Beshaar — 10. Épilogue')['numero']);
    }

    public function test_the_introduction_is_chapter_zero(): void
    {
        $this->assertSame(
            ['saga' => 'Le Dieu voilé', 'numero' => 0, 'titre' => 'La colère de Nemmereth'],
            BolTitreChapitre::decouper('Le Dieu voilé — Introduction : La colère de Nemmereth'),
        );
        $this->assertSame(['saga' => 'Le Dieu voilé', 'numero' => 0, 'titre' => 'Introduction'], BolTitreChapitre::decouper('Le Dieu voilé — Introduction'));
    }

    public function test_a_chapter_without_number_keeps_its_label(): void
    {
        $this->assertSame(
            ['saga' => 'Chroniques lémuriennes', 'numero' => null, 'titre' => 'Mariage amer'],
            BolTitreChapitre::decouper('Chroniques lémuriennes — Mariage amer'),
        );
    }

    public function test_without_em_dash_or_with_an_empty_half_it_names_no_scenario(): void
    {
        $this->assertSame(['saga' => null, 'numero' => null, 'titre' => 'mon premier scénario'], BolTitreChapitre::decouper('  mon premier scénario '));
        $this->assertSame(['saga' => null, 'numero' => null, 'titre' => '— Orphelin'], BolTitreChapitre::decouper('— Orphelin'));
        $this->assertSame(['saga' => null, 'numero' => null, 'titre' => 'Une - seule - partie'], BolTitreChapitre::decouper('Une - seule - partie'));
    }

    public function test_recomposes_what_it_split(): void
    {
        foreach ([
            'Perle du Beshaar — 1. Sacrilège à Satarla',
            'Le Dieu voilé — Introduction : La colère de Nemmereth',
            'Le Dieu voilé — Introduction',
            'Chroniques lémuriennes — Mariage amer',
            'mon premier scénario',
        ] as $titre) {
            ['saga' => $saga, 'numero' => $numero, 'titre' => $nom] = BolTitreChapitre::decouper($titre);
            $this->assertSame($titre, BolTitreChapitre::recomposer($saga, $numero, $nom));
        }
    }
}
