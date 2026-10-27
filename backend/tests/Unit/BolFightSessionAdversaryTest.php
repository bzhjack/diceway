<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolFightSessionService;
use App\Models\Bol\BolFightSession;
use App\Models\Bol\BolFightSessionCreature;
use App\Models\Bol\BolFightSessionDemon;
use App\Models\Bol\BolFightSessionPnj;
use PHPUnit\Framework\TestCase;

class BolFightSessionAdversaryTest extends TestCase
{
    /** Une session en mémoire, ses PNJ, créatures et démons posés en relations (aucune base de données). */
    private function session(array $pnjs = [], array $creatures = [], array $demons = []): BolFightSession
    {
        $rows = fn (string $class, array $lignes) => collect(array_map(
            fn (array $ligne) => (new $class())->forceFill($ligne),
            $lignes,
        ));

        $session = new BolFightSession();
        $session->setRelation('pnjs', $rows(BolFightSessionPnj::class, $pnjs));
        $session->setRelation('creatures', $rows(BolFightSessionCreature::class, $creatures));
        $session->setRelation('demons', $rows(BolFightSessionDemon::class, $demons));

        return $session;
    }

    public function test_no_adversary_on_an_empty_table(): void
    {
        $this->assertFalse((new BolFightSessionService())->hasAdversary($this->session(), []));
    }

    public function test_allies_of_the_heroes_are_not_adversaries(): void
    {
        $session = $this->session(pnjs: [['id' => 1, 'camp' => 'heros']], creatures: [['id' => 2, 'camp' => 'heros']]);

        $this->assertFalse((new BolFightSessionService())->hasAdversary($session, []));
    }

    public function test_an_enemy_pnj_creature_or_demon_is_an_adversary(): void
    {
        $service = new BolFightSessionService();

        $this->assertTrue($service->hasAdversary($this->session(pnjs: [['id' => 1, 'camp' => 'adversaires']]), []));
        $this->assertTrue($service->hasAdversary($this->session(creatures: [['id' => 1, 'camp' => 'adversaires']]), []));
        $this->assertTrue($service->hasAdversary($this->session(demons: [['id' => 1, 'camp' => 'adversaires']]), []));
    }

    public function test_excluded_enemies_do_not_count(): void
    {
        $session = $this->session(pnjs: [['id' => 1, 'camp' => 'adversaires']], creatures: [['id' => 7, 'camp' => 'adversaires']]);
        $service = new BolFightSessionService();

        $this->assertTrue($service->hasAdversary($session, ['pnj-1']));
        $this->assertFalse($service->hasAdversary($session, ['pnj-1', 'creature-7']));
    }
}
