<?php

namespace Tests\Unit;

use App\Http\Services\Bol\BolCombatState;
use PHPUnit\Framework\TestCase;

class BolCombatStateTest extends TestCase
{
    private function effet(array $over = []): array
    {
        return array_merge([
            'id'       => 'e-1',
            'origine'  => 'posture-defensive',
            'porteur'  => 'hero-1',
            'stat'     => 'defense',
            'valeur'   => 1,
            'quand'    => 'subie',
            'duree'    => ['type' => 'debut-tour-porteur'],
            'manuel'   => false,
        ], $over);
    }

    public function test_a_missing_state_is_round_one_with_nobody_played(): void
    {
        $this->assertSame(['round' => 1, 'joues' => [], 'effets' => [], 'exclus' => [], 'depart' => [], 'deMj' => null], BolCombatState::normalize(null));
        $this->assertSame(BolCombatState::INITIAL, BolCombatState::normalize('n-importe-quoi'));
        $this->assertSame(BolCombatState::INITIAL, BolCombatState::normalize([]));
    }

    public function test_keeps_a_valid_state(): void
    {
        $state = ['round' => 3, 'joues' => ['hero-1', 'pnj-7'], 'effets' => [$this->effet()], 'exclus' => ['creature-4'], 'depart' => ['hero-1' => 11, 'pnj-7' => 8], 'deMj' => 'bonus'];

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
            'round' => 2,
            'joues' => ['hero-1', 'hero-1', '', 12, null, ['x'], 'pnj-7'],
        ]);

        $this->assertSame(['hero-1', 'pnj-7'], $state['joues']);
    }

    public function test_ignores_unknown_fields(): void
    {
        $state = BolCombatState::normalize(['round' => 2, 'joues' => [], 'effets' => [], 'autre' => true]);

        $this->assertSame(['round', 'joues', 'effets', 'exclus', 'depart', 'deMj'], array_keys($state));
    }

    public function test_keeps_the_excluded_cards_and_drops_invalid_keys(): void
    {
        $state = BolCombatState::normalize(['round' => 1, 'exclus' => ['pnj-3', 'pnj-3', '', 5, 'hero-2']]);

        $this->assertSame(['pnj-3', 'hero-2'], $state['exclus']);
    }

    public function test_converts_the_old_format_into_effects(): void
    {
        $state = BolCombatState::normalize(['round' => 2, 'joues' => [], 'defense_totale' => ['hero-1'], 'attaquees' => ['pnj-7']]);

        $this->assertSame(
            [
                ['id' => 'e-1', 'origine' => 'defense-totale', 'porteur' => 'hero-1', 'stat' => 'defense', 'valeur' => 2, 'quand' => 'subie', 'duree' => ['type' => 'debut-tour-porteur'], 'manuel' => false],
                ['id' => 'e-2', 'origine' => 'bouclier-depense', 'porteur' => 'pnj-7', 'stat' => 'defense', 'valeur' => 0, 'quand' => 'subie', 'duree' => ['type' => 'fin-round'], 'manuel' => false],
            ],
            $state['effets'],
        );
        $this->assertArrayNotHasKey('defense_totale', $state);
        $this->assertArrayNotHasKey('attaquees', $state);
    }

    public function test_the_old_format_is_ignored_once_effects_exist(): void
    {
        $state = BolCombatState::normalize(['round' => 1, 'effets' => [], 'defense_totale' => ['hero-1']]);

        $this->assertSame([], $state['effets']);
    }

    public function test_drops_invalid_effects_and_keeps_the_valid_ones(): void
    {
        $valid = $this->effet(['id' => 'e-2']);
        $state = BolCombatState::normalize(['round' => 1, 'effets' => [
            'pas-un-tableau',
            $this->effet(['id' => '']),
            $this->effet(['id' => 'e-3', 'stat' => 'magie']),
            $this->effet(['id' => 'e-4', 'valeur' => 99]),
            $this->effet(['id' => 'e-5', 'valeur' => 'beaucoup']),
            $this->effet(['id' => 'e-6', 'quand' => 'jamais']),
            $this->effet(['id' => 'e-7', 'duree' => ['type' => 'a-vie']]),
            $this->effet(['id' => 'e-8', 'duree' => ['type' => 'usages', 'restants' => 0]]),
            $valid,
        ]]);

        $this->assertSame([$valid], $state['effets']);
    }

    public function test_drops_effects_with_a_repeated_id(): void
    {
        $state = BolCombatState::normalize(['round' => 1, 'effets' => [$this->effet(), $this->effet(['origine' => 'autre'])]]);

        $this->assertCount(1, $state['effets']);
    }

    public function test_keeps_at_most_two_hundred_effects(): void
    {
        $many = array_map(fn ($i) => $this->effet(['id' => "e-$i"]), range(1, 500));

        $this->assertCount(200, BolCombatState::normalize(['round' => 1, 'effets' => $many])['effets']);
    }

    public function test_drops_effects_with_overlong_identifiers(): void
    {
        $state = BolCombatState::normalize(['round' => 1, 'effets' => [
            $this->effet(['id' => str_repeat('x', 41)]),
            $this->effet(['id' => 'e-2', 'origine' => str_repeat('x', 41)]),
            $this->effet(['id' => 'e-3', 'porteur' => str_repeat('x', 61)]),
            $this->effet(['id' => 'e-4', 'cible' => str_repeat('x', 61)]),
            $this->effet(['id' => 'e-5']),
        ]]);

        $this->assertSame(['e-5'], array_column($state['effets'], 'id'));
    }

    public function test_merge_keeps_the_excluded_cards_and_effects_when_the_update_omits_them(): void
    {
        $existing = ['round' => 2, 'joues' => [], 'effets' => [$this->effet()], 'exclus' => ['pnj-3']];

        $merged = BolCombatState::merge(['round' => 3, 'joues' => ['hero-1']], $existing);

        $this->assertSame(['pnj-3'], $merged['exclus']);
        $this->assertSame([$this->effet()], $merged['effets']);
        $this->assertSame(3, $merged['round']);
        $this->assertSame(['hero-1'], $merged['joues']);
    }

    public function test_merge_lets_the_update_replace_the_effects_it_sends(): void
    {
        $existing = ['round' => 2, 'joues' => [], 'effets' => [$this->effet()], 'exclus' => []];

        $this->assertSame([], BolCombatState::merge(['round' => 2, 'joues' => [], 'effets' => []], $existing)['effets']);
    }

    public function test_keeps_the_optional_fields_of_a_manual_effect(): void
    {
        $manual = $this->effet([
            'id' => 'e-1', 'manuel' => true, 'cible' => 'pnj-7', 'libelle' => str_repeat('x', 100),
            'duree' => ['type' => 'usages', 'restants' => 2, 'expireAuTour' => true],
        ]);
        $kept = BolCombatState::normalize(['round' => 1, 'effets' => [$manual]])['effets'][0];

        $this->assertSame('pnj-7', $kept['cible']);
        $this->assertSame(60, mb_strlen($kept['libelle']));
        $this->assertSame(['type' => 'usages', 'restants' => 2, 'expireAuTour' => true], $kept['duree']);
        $this->assertTrue($kept['manuel']);
    }

    public function test_keeps_only_well_formed_starting_vitalities(): void
    {
        $state = BolCombatState::normalize(['depart' => ['hero-1' => 11, 'pnj-2' => '8', '' => 3, 5 => 4, 'demon-3' => -2, 'creature-4' => 5000]]);

        $this->assertSame(['hero-1' => 11, 'demon-3' => -2], $state['depart']);
    }

    public function test_keeps_only_a_known_gm_die(): void
    {
        $this->assertSame('malus', BolCombatState::normalize(['deMj' => 'malus'])['deMj']);
        $this->assertNull(BolCombatState::normalize(['deMj' => 'autre'])['deMj']);
        $this->assertNull(BolCombatState::normalize(['deMj' => 1])['deMj']);
    }

    public function test_merge_keeps_the_gm_die_when_the_update_omits_it_and_removes_it_when_sent_null(): void
    {
        $existing = ['round' => 2, 'joues' => [], 'deMj' => 'bonus'];

        $this->assertSame('bonus', BolCombatState::merge(['round' => 2, 'joues' => []], $existing)['deMj']);
        $this->assertNull(BolCombatState::merge(['round' => 2, 'joues' => [], 'deMj' => null], $existing)['deMj']);
        $this->assertSame('malus', BolCombatState::merge(['round' => 2, 'joues' => [], 'deMj' => 'malus'], $existing)['deMj']);
    }

    public function test_the_front_cannot_change_the_starting_vitalities(): void
    {
        $existing = ['round' => 2, 'joues' => [], 'effets' => [], 'exclus' => [], 'depart' => ['hero-1' => 11]];

        $this->assertSame(['hero-1' => 11], BolCombatState::merge(['round' => 2, 'joues' => [], 'depart' => ['hero-1' => 3]], $existing)['depart']);
        $this->assertSame(['hero-1' => 11], BolCombatState::merge(['round' => 2, 'joues' => []], $existing)['depart']);
    }
}
