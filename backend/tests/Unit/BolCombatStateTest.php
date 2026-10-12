<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolCombatState;
use PHPUnit\Framework\TestCase;

class BolCombatStateTest extends TestCase
{
    public function test_a_missing_state_is_round_one_with_nobody_played(): void
    {
        $this->assertSame(['round' => 1, 'joues' => [], 'defense_totale' => [], 'exclus' => []], BolCombatState::normalize(null));
        $this->assertSame(BolCombatState::INITIAL, BolCombatState::normalize('n-importe-quoi'));
        $this->assertSame(BolCombatState::INITIAL, BolCombatState::normalize([]));
    }

    public function test_keeps_a_valid_state(): void
    {
        $state = ['round' => 3, 'joues' => ['hero-1', 'pnj-7'], 'defense_totale' => ['hero-1'], 'exclus' => ['creature-4']];

        $this->assertSame($state, BolCombatState::normalize($state));
    }

    public function test_round_is_at_least_one(): void
    {
        $this->assertSame(1, BolCombatState::normalize(['round' => 0])['round']);
        $this->assertSame(1, BolCombatState::normalize(['round' => -4])['round']);
        $this->assertSame(1, BolCombatState::normalize(['round' => 'abc'])['round']);
        $this->assertSame(2, BolCombatState::normalize(['round' => '2'])['round']);
    }

    public function test_drops_duplicates_empty_and_non_string_keys(): void
    {
        $state = BolCombatState::normalize([
            'round'          => 2,
            'joues'          => ['hero-1', 'hero-1', '', 12, null, ['x'], 'pnj-7'],
            'defense_totale' => 'pas-un-tableau',
        ]);

        $this->assertSame(['hero-1', 'pnj-7'], $state['joues']);
        $this->assertSame([], $state['defense_totale']);
    }

    public function test_ignores_unknown_fields(): void
    {
        $state = BolCombatState::normalize(['round' => 2, 'joues' => [], 'defense_totale' => [], 'autre' => true]);

        $this->assertSame(['round', 'joues', 'defense_totale', 'exclus'], array_keys($state));
    }

    public function test_keeps_the_excluded_cards_and_drops_invalid_keys(): void
    {
        $state = BolCombatState::normalize(['round' => 1, 'exclus' => ['pnj-3', 'pnj-3', '', 5, 'hero-2']]);

        $this->assertSame(['pnj-3', 'hero-2'], $state['exclus']);
    }
}
