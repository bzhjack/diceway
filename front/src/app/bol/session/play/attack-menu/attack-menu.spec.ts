import {describe, expect, it} from 'vitest';
import {BolCombatOptionModel} from '../../../services/bol-combat-reference.service';
import {filterAttackMenuCombatOptions, filterVisiblePostures} from './attack-menu';

function option(slug: string, ordre: number): BolCombatOptionModel {
  return {id: ordre, label: slug, slug, modificateur: 0, modificateur_armor: false, note: '', ordre};
}

const ALL_OPTIONS: readonly BolCombatOptionModel[] = [
  option('none', 1),
  option('offensive', 2),
  option('intrepid', 3),
  option('defensive', 4),
  option('dual-parry', 5),
  option('dual-strike', 6),
  option('armor-chink', 7),
];

describe('filterAttackMenuCombatOptions', () => {
  it('keeps every posture this menu can handle, including the dual-wield ones', () => {
    const slugs = filterAttackMenuCombatOptions(ALL_OPTIONS).map((o) => o.slug);
    expect(slugs).toEqual(['none', 'offensive', 'intrepid', 'defensive', 'dual-parry', 'dual-strike', 'armor-chink']);
  });

  it('sorts by ordre', () => {
    const shuffled = [option('armor-chink', 7), option('none', 1), option('offensive', 2)];
    expect(filterAttackMenuCombatOptions(shuffled).map((o) => o.slug)).toEqual(['none', 'offensive', 'armor-chink']);
  });
});

describe('filterVisiblePostures', () => {
  it('hides dual-wield postures when the main weapon is heavy', () => {
    const slugs = filterVisiblePostures(ALL_OPTIONS, 'd6B', ['d6M', 'd6']).map((o) => o.slug);
    expect(slugs).not.toContain('dual-parry');
    expect(slugs).not.toContain('dual-strike');
  });

  it('hides dual-wield postures when no other light/medium weapon is available', () => {
    const slugs = filterVisiblePostures(ALL_OPTIONS, 'd6M', ['d6B']).map((o) => o.slug);
    expect(slugs).not.toContain('dual-parry');
    expect(slugs).not.toContain('dual-strike');
  });

  it('shows dual-wield postures when the main weapon and at least one other are both light/medium', () => {
    const slugs = filterVisiblePostures(ALL_OPTIONS, 'd6M', ['d6', 'd6B']).map((o) => o.slug);
    expect(slugs).toContain('dual-parry');
    expect(slugs).toContain('dual-strike');
  });

  it('keeps every non-dual-wield posture untouched regardless of weapon', () => {
    const slugs = filterVisiblePostures(ALL_OPTIONS, 'd6B', []).map((o) => o.slug);
    expect(slugs).toEqual(['none', 'offensive', 'intrepid', 'defensive', 'armor-chink']);
  });
});
