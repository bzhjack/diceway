<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolFightSessionService;
use PHPUnit\Framework\TestCase;

class BolFightSessionVilenieTest extends TestCase
{
    public function test_vilenie_initiale_seulement_pour_un_rival(): void
    {
        $this->assertSame(5, BolFightSessionService::vilenieInitiale('rival', 5));
        $this->assertSame(0, BolFightSessionService::vilenieInitiale('rival', null));
        $this->assertNull(BolFightSessionService::vilenieInitiale('coriace', 3));
        $this->assertNull(BolFightSessionService::vilenieInitiale('pietaille', 0));
    }

    public function test_vilenie_suivante_jamais_negative(): void
    {
        $this->assertSame(4, BolFightSessionService::vilenieSuivante(5, -1));
        $this->assertSame(6, BolFightSessionService::vilenieSuivante(5, 1));
        $this->assertSame(0, BolFightSessionService::vilenieSuivante(0, -1));
    }

    public function test_pas_de_vilenie_pour_qui_n_en_a_pas(): void
    {
        $this->assertNull(BolFightSessionService::vilenieSuivante(null, 1));
    }
}
