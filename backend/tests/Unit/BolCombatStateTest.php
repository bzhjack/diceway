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
        $this->assertSame(['round' => 1, 'joues' => [], 'effets' => [], 'exclus' => [], 'depart' => [], 'fuis' => [], 'melee' => null], BolCombatState::normalize(null));
        $this->assertSame(BolCombatState::INITIAL, BolCombatState::normalize('n-importe-quoi'));
        $this->assertSame(BolCombatState::INITIAL, BolCombatState::normalize([]));
    }

    public function test_keeps_a_valid_state(): void
    {
        $state = ['round' => 3, 'joues' => ['hero-1', 'pnj-7'], 'effets' => [$this->effet()], 'exclus' => ['creature-4', 'pnj-9'], 'depart' => ['hero-1' => 11, 'pnj-7' => 8], 'fuis' => ['pnj-9'], 'melee' => 2];

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

        $this->assertSame(['round', 'joues', 'effets', 'exclus', 'depart', 'fuis', 'melee'], array_keys($state));
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

    public function test_keeps_an_effect_that_lasts_a_number_of_rounds(): void
    {
        $regenere = $this->effet(['id' => 'e-2', 'stat' => 'action', 'valeur' => -1, 'quand' => 'attaque', 'duree' => ['type' => 'rounds', 'restants' => 2]]);
        $kept = BolCombatState::normalize(['round' => 1, 'effets' => [$regenere]])['effets'];

        $this->assertSame(['type' => 'rounds', 'restants' => 2], $kept[0]['duree']);
    }

    public function test_drops_an_effect_whose_number_of_rounds_is_out_of_bounds(): void
    {
        $effets = [
            $this->effet(['id' => 'e-1', 'duree' => ['type' => 'rounds', 'restants' => 0]]),
            $this->effet(['id' => 'e-2', 'duree' => ['type' => 'rounds', 'restants' => 21]]),
            $this->effet(['id' => 'e-3', 'duree' => ['type' => 'rounds']]),
            $this->effet(['id' => 'e-4', 'duree' => ['type' => 'rounds', 'restants' => 1, 'expireAuTour' => true]]),
        ];

        $kept = BolCombatState::normalize(['round' => 1, 'effets' => $effets])['effets'];

        $this->assertSame(['e-4'], array_column($kept, 'id'));
        $this->assertSame(['type' => 'rounds', 'restants' => 1], $kept[0]['duree']);
    }

    public function test_keeps_only_well_formed_starting_vitalities(): void
    {
        $state = BolCombatState::normalize(['depart' => ['hero-1' => 11, 'pnj-2' => '8', '' => 3, 5 => 4, 'demon-3' => -2, 'creature-4' => 5000]]);

        $this->assertSame(['hero-1' => 11, 'demon-3' => -2], $state['depart']);
    }

    public function test_drops_the_gm_die_for_everyone_that_an_older_version_saved(): void
    {
        $this->assertArrayNotHasKey('deMj', BolCombatState::normalize(['round' => 2, 'deMj' => 'bonus']));
    }

    public function test_the_front_cannot_change_the_starting_vitalities(): void
    {
        $existing = ['round' => 2, 'joues' => [], 'effets' => [], 'exclus' => [], 'depart' => ['hero-1' => 11]];

        $this->assertSame(['hero-1' => 11], BolCombatState::merge(['round' => 2, 'joues' => [], 'depart' => ['hero-1' => 3]], $existing)['depart']);
        $this->assertSame(['hero-1' => 11], BolCombatState::merge(['round' => 2, 'joues' => []], $existing)['depart']);
    }

    public function test_a_card_that_fled_stays_excluded(): void
    {
        $state = BolCombatState::normalize(['round' => 2, 'exclus' => ['creature-4'], 'fuis' => ['pnj-3', 'pnj-3', '', 7]]);

        $this->assertSame(['pnj-3'], $state['fuis']);
        $this->assertSame(['creature-4', 'pnj-3'], $state['exclus']);
    }

    public function test_keeps_the_round_of_the_mook_melee_only_when_well_formed(): void
    {
        $this->assertSame(3, BolCombatState::normalize(['round' => 3, 'melee' => 3])['melee']);
        $this->assertNull(BolCombatState::normalize(['round' => 3, 'melee' => 0])['melee']);
        $this->assertNull(BolCombatState::normalize(['round' => 3, 'melee' => '2'])['melee']);
        $this->assertNull(BolCombatState::normalize(['round' => 3, 'melee' => 2.5])['melee']);
        $this->assertNull(BolCombatState::normalize(['round' => 3])['melee']);
    }

    public function test_merge_keeps_the_escapes_and_the_mook_melee_when_the_update_omits_them(): void
    {
        $existing = ['round' => 2, 'joues' => [], 'effets' => [], 'exclus' => ['pnj-3'], 'fuis' => ['pnj-3'], 'melee' => 2];

        $merged = BolCombatState::merge(['round' => 2, 'joues' => ['hero-1']], $existing);

        $this->assertSame(['pnj-3'], $merged['fuis']);
        $this->assertSame(2, $merged['melee']);
    }

    public function test_merge_never_brings_back_a_rival_who_fled(): void
    {
        // L'état envoyé a été calculé avant la fuite (enregistrée à part, avec sa dépense de vilénie) : il ne l'efface pas.
        $existing = ['round' => 2, 'joues' => [], 'effets' => [], 'exclus' => ['pnj-3'], 'fuis' => ['pnj-3'], 'melee' => null];

        $merged = BolCombatState::merge(['round' => 2, 'joues' => ['hero-1'], 'exclus' => ['creature-4'], 'fuis' => ['pnj-5']], $existing);

        $this->assertSame(['pnj-5', 'pnj-3'], $merged['fuis']);
        $this->assertSame(['creature-4', 'pnj-5', 'pnj-3'], $merged['exclus']);
    }

    public function test_merge_lets_the_update_record_an_escape_and_a_mook_melee(): void
    {
        $existing = ['round' => 2, 'joues' => [], 'effets' => [], 'exclus' => [], 'fuis' => [], 'melee' => null];

        $merged = BolCombatState::merge(['round' => 2, 'joues' => [], 'exclus' => ['pnj-3'], 'fuis' => ['pnj-3'], 'melee' => 2], $existing);

        $this->assertSame(['pnj-3'], $merged['exclus']);
        $this->assertSame(['pnj-3'], $merged['fuis']);
        $this->assertSame(2, $merged['melee']);
    }

    public function test_a_new_reaction_roll_keeps_the_rounds_escapes_and_mook_melee(): void
    {
        $enCours = BolCombatState::normalize(['round' => 3, 'joues' => ['hero-1'], 'exclus' => ['creature-4', 'pnj-3'], 'fuis' => ['pnj-3'], 'melee' => 3, 'depart' => ['hero-1' => 9]]);

        $state = BolCombatState::nouveauJet($enCours, ['hero-2']);

        $this->assertSame(3, $state['round']);
        $this->assertSame([], $state['joues']);
        $this->assertSame(['hero-2', 'pnj-3'], $state['exclus']);
        $this->assertSame(['pnj-3'], $state['fuis']);
        $this->assertSame(3, $state['melee']);
        $this->assertSame(['hero-1' => 9], $state['depart']);
    }

    public function test_a_new_reaction_roll_keeps_the_effects_that_last_beyond_the_turn(): void
    {
        $effet = fn (string $id, string $origine, string $porteur, array $duree, array $extra = []) => [
            'id' => $id, 'origine' => $origine, 'porteur' => $porteur, 'stat' => 'action', 'valeur' => 0, 'quand' => 'subie', 'duree' => $duree, 'manuel' => false,
        ] + $extra;
        $enCours = BolCombatState::normalize(['round' => 3, 'joues' => ['hero-1'], 'effets' => [
            $effet('e-1', 'paralyse', 'hero-1', ['type' => 'combat']),
            $effet('e-2', 'stabilise', 'hero-2', ['type' => 'combat']),
            $effet('e-3', 'egratignure', 'pnj-5', ['type' => 'action-porteur']),
            $effet('e-4', 'de-malus', 'demon-6', ['type' => 'rounds', 'restants' => 2]),
            $effet('e-5', 'manuel', 'hero-1', ['type' => 'usages', 'restants' => 2]),
            $effet('e-6', 'defense-totale', 'hero-1', ['type' => 'debut-tour-porteur']),
            $effet('e-7', 'parade', 'hero-2', ['type' => 'usages', 'restants' => 1, 'expireAuTour' => true]),
            $effet('e-8', 'bouclier-depense', 'hero-2', ['type' => 'fin-round']),
            $effet('e-9', 'mains-nues', 'creature-4', ['type' => 'combat']),
            $effet('e-10', 'feinte', 'hero-2', ['type' => 'combat'], ['cible' => 'creature-4']),
        ]]);

        $state = BolCombatState::nouveauJet($enCours, ['creature-4']);

        // Ce qui dure le combat, des rounds ou des attaques, ou attend l'action de la carte, reste ; ce qui tient au tour ou au round en
        // cours tombe, comme les effets portés par une carte que le nouveau jet laisse hors du combat ou qui la visent.
        $this->assertSame(['e-1', 'e-2', 'e-3', 'e-4', 'e-5'], array_column($state['effets'], 'id'));
    }
}
