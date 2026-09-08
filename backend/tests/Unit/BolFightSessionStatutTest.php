<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolFightSessionService;
use PHPUnit\Framework\TestCase;

class BolFightSessionStatutTest extends TestCase
{
    public function test_libre_when_no_adversaries(): void
    {
        $service = new BolFightSessionService();

        $statut = $service->determineInitialStatut([
            'heros' => [['heroId' => 'abc']],
            'creatures' => [],
            'demons' => [],
            'pnjs' => [],
        ]);

        $this->assertSame('libre', $statut);
    }

    public function test_combat_when_creatures_present(): void
    {
        $service = new BolFightSessionService();

        $statut = $service->determineInitialStatut([
            'heros' => [],
            'creatures' => [['creatureId' => 'x', 'qty' => 1]],
            'demons' => [],
            'pnjs' => [],
        ]);

        $this->assertSame('combat', $statut);
    }

    public function test_combat_when_demons_present(): void
    {
        $service = new BolFightSessionService();

        $statut = $service->determineInitialStatut([
            'demons' => [['demonId' => 'x', 'qty' => 1]],
        ]);

        $this->assertSame('combat', $statut);
    }

    public function test_combat_when_pnjs_present(): void
    {
        $service = new BolFightSessionService();

        $statut = $service->determineInitialStatut([
            'pnjs' => [['pnjId' => 'x']],
        ]);

        $this->assertSame('combat', $statut);
    }

    public function test_libre_when_data_is_empty(): void
    {
        $service = new BolFightSessionService();

        $this->assertSame('libre', $service->determineInitialStatut([]));
    }
}
