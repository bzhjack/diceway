<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolHerosService;
use PHPUnit\Framework\TestCase;

class BolHerosArmeFavoriteTest extends TestCase
{
    public function test_le_nom_de_l_arme_est_nettoye(): void
    {
        $this->assertSame('Kriss', BolHerosService::precisionArmeFavorite('  Kriss '));
    }

    public function test_un_nom_vide_retire_l_arme(): void
    {
        $this->assertNull(BolHerosService::precisionArmeFavorite(''));
        $this->assertNull(BolHerosService::precisionArmeFavorite('   '));
        $this->assertNull(BolHerosService::precisionArmeFavorite(null));
    }
}
