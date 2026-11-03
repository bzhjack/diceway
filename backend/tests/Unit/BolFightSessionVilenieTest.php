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

    public function test_vilenie_recalee_suit_le_rang_et_le_maximum_de_la_fiche(): void
    {
        // Devenu rival : la ligne qui n'en avait pas reçoit celle de la fiche.
        $this->assertSame(3, BolFightSessionService::vilenieRecalee(null, 'rival', 3));
        // N'est plus rival : plus de vilénie.
        $this->assertNull(BolFightSessionService::vilenieRecalee(2, 'coriace', 3));
        $this->assertNull(BolFightSessionService::vilenieRecalee(null, 'pietaille', 3));
        // Maximum abaissé : ramenée au maximum ; relevé : ce qui est dépensé n'est pas rendu.
        $this->assertSame(2, BolFightSessionService::vilenieRecalee(3, 'rival', 2));
        $this->assertSame(1, BolFightSessionService::vilenieRecalee(1, 'rival', 5));
        // Un rival sans vilénie sur sa fiche : les points donnés à la main par le MJ restent, comme la foi et le pouvoir.
        $this->assertSame(2, BolFightSessionService::vilenieRecalee(2, 'rival', 0));
        $this->assertSame(0, BolFightSessionService::vilenieRecalee(null, 'rival', null));
    }
}
