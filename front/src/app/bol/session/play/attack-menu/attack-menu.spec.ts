import {describe, expect, it} from 'vitest';
import {BolCombatOptionModel} from '../../../services/bol-combat-reference.service';
import {filterAttackMenuCombatOptions} from './attack-menu';

function option(slug: string, ordre: number): BolCombatOptionModel {
  return {id: ordre, label: slug, slug, modificateur: 0, modificateur_armor: false, note: '', ordre};
}

describe('filterAttackMenuCombatOptions', () => {
  const all: readonly BolCombatOptionModel[] = [
    option('none', 1),
    option('offensive', 2),
    option('intrepid', 3),
    option('defensive', 4),
    option('dual-parry', 5),
    option('dual-strike', 6),
    option('armor-chink', 7),
  ];

  it('keeps only the single-modifier options handled by this menu', () => {
    const slugs = filterAttackMenuCombatOptions(all).map((o) => o.slug);
    expect(slugs).toEqual(['none', 'offensive', 'intrepid', 'defensive', 'armor-chink']);
  });

  it('excludes dual-wield options, which need a secondary weapon pick not supported here', () => {
    const slugs = filterAttackMenuCombatOptions(all).map((o) => o.slug);
    expect(slugs).not.toContain('dual-parry');
    expect(slugs).not.toContain('dual-strike');
  });

  it('sorts by ordre', () => {
    const shuffled = [option('armor-chink', 7), option('none', 1), option('offensive', 2)];
    expect(filterAttackMenuCombatOptions(shuffled).map((o) => o.slug)).toEqual(['none', 'offensive', 'armor-chink']);
  });
});
