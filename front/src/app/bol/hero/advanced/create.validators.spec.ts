import {
  attributRangeErrors,
  attributsBudgetErrors,
  carriereRangeErrors,
  carrieresBudgetErrors,
  combatBudgetErrors,
} from './create.validators';
import {
  automaticLanguageIdsForRegion,
  lemurianLanguage,
  selectedLanguageTarget,
} from './create.rules';
import {BolLangueModel} from '../../models/bol-langue.model';
import {BolRegionModel} from '../../models/bol-region.model';
import {BolHerosCarriereModel} from '../../models/bol-carriere.model';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function langue(id: number, estLemurienne: boolean): BolLangueModel {
  return {id, langue: `L${id}`, est_lemurienne: estLemurienne} as BolLangueModel;
}

function region(overrides: Partial<BolRegionModel> = {}): BolRegionModel {
  return {id: 1, region: 'TestRegion', langue_native_id: null, ...overrides} as BolRegionModel;
}

function carriere(carriereId: number, value: number): BolHerosCarriereModel {
  return {carriere_id: carriereId, value, carriere: {donne_langue: false}} as unknown as BolHerosCarriereModel;
}

function carriereWithLangue(carriereId: number, value: number): BolHerosCarriereModel {
  return {carriere_id: carriereId, value, carriere: {donne_langue: true}} as unknown as BolHerosCarriereModel;
}

// ===========================================================================
// R-ATTR-1 — Chaque attribut est compris entre -1 et 3
// ===========================================================================

describe('R-ATTR-1 — attributRangeErrors : chaque attribut est compris entre -1 et 3', () => {
  it('accepte 0 (valeur neutre)', () => expect(attributRangeErrors(0)).toBeNull());
  it('accepte -1 (minimum autorisé)', () => expect(attributRangeErrors(-1)).toBeNull());
  it('accepte 3 (maximum autorisé)', () => expect(attributRangeErrors(3)).toBeNull());
  it('refuse -2 (en dessous du minimum)', () => expect(attributRangeErrors(-2)?.kind).toBe('tooSmallAttr'));
  it('refuse 4 (au-dessus du maximum)', () => expect(attributRangeErrors(4)?.kind).toBe('tooBigAttr'));
});

// ===========================================================================
// R-ATTR-2 — La somme des 4 attributs ne dépasse pas 4 points
// ===========================================================================

describe('R-ATTR-2 — attributsBudgetErrors : somme des attributs ≤ 4', () => {
  it('accepte une somme égale à 4 (budget utilisé en entier)', () => {
    expect(attributsBudgetErrors({vigueur: 1, agilite: 1, esprit: 1, aura: 1})).toEqual([]);
  });

  it('accepte une somme inférieure à 4', () => {
    expect(attributsBudgetErrors({vigueur: 0, agilite: 0, esprit: 0, aura: 0})).toEqual([]);
  });

  it('refuse une somme de 5 (dépassement de 1)', () => {
    const errors = attributsBudgetErrors({vigueur: 2, agilite: 1, esprit: 1, aura: 1});
    expect(errors.some((error) => error.kind === 'attrSumExceeded')).toBe(true);
  });

  it('refuse une somme de 8 (dépassement maximum possible)', () => {
    const errors = attributsBudgetErrors({vigueur: 2, agilite: 2, esprit: 2, aura: 2});
    expect(errors.some((error) => error.kind === 'attrSumExceeded')).toBe(true);
  });
});

// ===========================================================================
// R-ATTR-3 — Un seul attribut peut descendre à -1
// ===========================================================================

describe('R-ATTR-3 — attributsBudgetErrors : un seul attribut peut être à -1', () => {
  it('accepte exactement un attribut à -1', () => {
    expect(attributsBudgetErrors({vigueur: -1, agilite: 1, esprit: 1, aura: 1})).toEqual([]);
  });

  it('refuse deux attributs à -1', () => {
    const errors = attributsBudgetErrors({vigueur: -1, agilite: -1, esprit: 0, aura: 0});
    expect(errors.some((error) => error.kind === 'attrTooManyNegative')).toBe(true);
  });

  it('refuse quatre attributs à -1', () => {
    const errors = attributsBudgetErrors({vigueur: -1, agilite: -1, esprit: -1, aura: -1});
    expect(errors.some((error) => error.kind === 'attrTooManyNegative')).toBe(true);
  });
});

// ===========================================================================
// R-CARR-1 — Chaque rang de carrière est compris entre 0 et 3
// ===========================================================================

describe('R-CARR-1 — carriereRangeErrors : rang compris entre 0 et 3', () => {
  it('accepte 0 (rang débutant)', () => expect(carriereRangeErrors(0)).toBeNull());
  it('accepte 1', () => expect(carriereRangeErrors(1)).toBeNull());
  it('accepte 3 (rang maximum)', () => expect(carriereRangeErrors(3)).toBeNull());
  it('refuse -1 (rang négatif impossible)', () => expect(carriereRangeErrors(-1)?.kind).toBe('tooSmallAttr'));
  it('refuse 4 (au-dessus du rang maximum)', () => expect(carriereRangeErrors(4)?.kind).toBe('tooBigAttr'));
});

// ===========================================================================
// R-CARR-2 — La somme des rangs de carrières ne dépasse pas 4 (budget standard)
// ===========================================================================

describe('R-CARR-2 — carrieresBudgetErrors : somme des carrières ≤ 4 (budget standard)', () => {
  it('accepte une somme égale à 4 (budget utilisé en entier)', () => {
    expect(carrieresBudgetErrors([1, 1, 1, 1], 4)).toEqual([]);
  });

  it('accepte une somme inférieure à 4', () => {
    expect(carrieresBudgetErrors([0, 0, 0, 0], 4)).toEqual([]);
  });

  it('refuse une somme de 5', () => {
    expect(carrieresBudgetErrors([2, 1, 1, 1], 4).some((error) => error.kind === 'carrSumExceeded')).toBe(true);
  });

  it('refuse une somme de 8 (rang 2 sur 4 carrières)', () => {
    expect(carrieresBudgetErrors([2, 2, 2, 2], 4).some((error) => error.kind === 'carrSumExceeded')).toBe(true);
  });

  it('accepte sorcier rang 3 — la somme 3 reste dans le budget', () => {
    expect(carrieresBudgetErrors([3, 0, 0, 0], 4)).toEqual([]);
  });

  it('accepte alchimiste rang 3 — la somme 3 reste dans le budget', () => {
    expect(carrieresBudgetErrors([3, 0, 0, 0], 4)).toEqual([]);
  });
});

// ===========================================================================
// R-CARR-3 — Non-combattant : budget carrières porté à 6
// ===========================================================================

describe('R-CARR-3 — carrieresBudgetErrors : Non-combattant bénéficie de 6 points de carrières', () => {
  it('accepte une somme de 6 avec budget=6', () => {
    expect(carrieresBudgetErrors([3, 2, 1, 0], 6)).toEqual([]);
  });

  it('accepte une somme de 4 avec budget=6', () => {
    expect(carrieresBudgetErrors([1, 1, 1, 1], 6)).toEqual([]);
  });

  it('refuse une somme de 7 avec budget=6', () => {
    expect(carrieresBudgetErrors([3, 2, 1, 1], 6).some((error) => error.kind === 'carrSumExceeded')).toBe(true);
  });

  it('refuse une somme de 5 avec budget standard=4', () => {
    expect(carrieresBudgetErrors([2, 2, 1, 0], 4).some((error) => error.kind === 'carrSumExceeded')).toBe(true);
  });
});

// ===========================================================================
// R-COMBAT-1 — La somme des aptitudes de combat ne dépasse pas 4 (budget standard)
// ===========================================================================

describe('R-COMBAT-1 — combatBudgetErrors : somme des aptitudes ≤ 4 (budget standard)', () => {
  it('accepte une somme égale à 4', () => {
    expect(combatBudgetErrors({initiative: 2, melee: 1, tir: 0, defense: 1}, 4)).toEqual([]);
  });

  it('accepte une somme inférieure à 4', () => {
    expect(combatBudgetErrors({initiative: 0, melee: 0, tir: 0, defense: 0}, 4)).toEqual([]);
  });

  it('refuse une somme de 5', () => {
    const errors = combatBudgetErrors({initiative: 2, melee: 1, tir: 1, defense: 1}, 4);
    expect(errors.some((error) => error.kind === 'aptSumExceeded')).toBe(true);
  });

  it('refuse une somme de 8 (tous à 2)', () => {
    const errors = combatBudgetErrors({initiative: 2, melee: 2, tir: 2, defense: 2}, 4);
    expect(errors.some((error) => error.kind === 'aptSumExceeded')).toBe(true);
  });
});

// ===========================================================================
// R-COMBAT-2 — Non-combattant : seulement 2 points d'aptitudes de combat
// ===========================================================================

describe("R-COMBAT-2 — combatBudgetErrors : Non-combattant limité à 2 points d'aptitudes de combat", () => {
  it('accepte une somme de 2 avec budget=2', () => {
    expect(combatBudgetErrors({initiative: 1, melee: 0, tir: 0, defense: 1}, 2)).toEqual([]);
  });

  it('accepte une somme de 0 avec budget=2', () => {
    expect(combatBudgetErrors({initiative: 0, melee: 0, tir: 0, defense: 0}, 2)).toEqual([]);
  });

  it('refuse une somme de 3 avec budget=2', () => {
    const errors = combatBudgetErrors({initiative: 2, melee: 1, tir: 0, defense: 0}, 2);
    expect(errors.some((error) => error.kind === 'aptSumExceeded')).toBe(true);
  });

  it('refuse une somme de 4 (budget standard) avec budget=2', () => {
    const errors = combatBudgetErrors({initiative: 1, melee: 1, tir: 1, defense: 1}, 2);
    expect(errors.some((error) => error.kind === 'aptSumExceeded')).toBe(true);
  });
});

// ===========================================================================
// R-COMBAT-3 — Une seule aptitude de combat peut descendre à -1
// ===========================================================================

describe('R-COMBAT-3 — combatBudgetErrors : une seule aptitude peut être à -1', () => {
  it('accepte exactement une aptitude à -1', () => {
    expect(combatBudgetErrors({initiative: -1, melee: 1, tir: 1, defense: 1}, 4)).toEqual([]);
  });

  it('refuse deux aptitudes à -1 (initiative et mêlée)', () => {
    const errors = combatBudgetErrors({initiative: -1, melee: -1, tir: 0, defense: 0}, 4);
    expect(errors.some((error) => error.kind === 'aptTooManyNegative')).toBe(true);
  });

  it('refuse trois aptitudes à -1', () => {
    const errors = combatBudgetErrors({initiative: -1, melee: -1, tir: -1, defense: 0}, 4);
    expect(errors.some((error) => error.kind === 'aptTooManyNegative')).toBe(true);
  });
});

// ===========================================================================
// R-LANG-1 — Détection de la langue lémurienne dans la liste
// ===========================================================================

describe('R-LANG-1 — lemurianLanguage : identifie la langue lémurienne', () => {
  const lemurien = langue(1, true);
  const autre = langue(2, false);

  it('retourne la langue lémurienne quand elle est présente', () => {
    expect(lemurianLanguage([autre, lemurien])).toBe(lemurien);
  });

  it('retourne null si aucune langue lémurienne', () => {
    expect(lemurianLanguage([autre])).toBeNull();
  });

  it('retourne null pour une liste vide', () => {
    expect(lemurianLanguage([])).toBeNull();
  });

  it('retourne null pour null', () => {
    expect(lemurianLanguage(null)).toBeNull();
  });
});

// ===========================================================================
// R-LANG-2 — Langues automatiques à la création selon l'origine
// ===========================================================================

describe('R-LANG-2 — automaticLanguageIdsForRegion : langues automatiques par région', () => {
  const lemurien = langue(1, true);
  const natif = langue(2, false);

  it('retourne [lémurienne] quand la langue native est la même que la lémurienne', () => {
    const r = region({langue_native_id: 1});
    expect(automaticLanguageIdsForRegion(r, [lemurien])).toEqual([1]);
  });

  it('retourne [lémurienne, native] quand la langue native est différente', () => {
    const r = region({langue_native_id: 2});
    expect(automaticLanguageIdsForRegion(r, [lemurien, natif])).toEqual([1, 2]);
  });

  it('retourne [lémurienne] quand la région n\'a pas de langue native renseignée', () => {
    const r = region({langue_native_id: null});
    expect(automaticLanguageIdsForRegion(r, [lemurien, natif])).toEqual([1]);
  });

  it('retourne [] sans région', () => {
    expect(automaticLanguageIdsForRegion(null, [lemurien])).toEqual([]);
  });

  it('retourne [] sans liste de langues', () => {
    expect(automaticLanguageIdsForRegion(region(), null)).toEqual([]);
  });
});

// ===========================================================================
// R-LANG-3 — Nombre de langues cibles = max(Esprit, 0) + bonus carrières + bonus origine
// ===========================================================================

describe('R-LANG-3 — selectedLanguageTarget : nombre de langues = max(Esprit,0) + bonus', () => {
  const lemurien = langue(1, true);
  const natif = langue(2, false);

  it('esprit 0 sans bonus donne 0 langue supplémentaire (hors automatiques)', () => {
    const r = region({langue_native_id: 2});
    expect(selectedLanguageTarget(r, 0, [], [lemurien, natif])).toBe(0);
  });

  it('esprit 2 donne 2 langues supplémentaires', () => {
    const r = region({langue_native_id: 2});
    expect(selectedLanguageTarget(r, 2, [], [lemurien, natif])).toBe(2);
  });

  it('esprit négatif est ramené à 0 (pas de malus sur les langues)', () => {
    const r = region({langue_native_id: 2});
    expect(selectedLanguageTarget(r, -1, [], [lemurien, natif])).toBe(0);
  });

  it('carrière donne_langue rang 1 ajoute 1 au total', () => {
    const r = region({langue_native_id: 2});
    const carrieres = [carriereWithLangue(5, 1)];
    expect(selectedLanguageTarget(r, 0, carrieres, [lemurien, natif])).toBe(1);
  });

  it('carrière donne_langue rang 2 ajoute 2 au total', () => {
    const r = region({langue_native_id: 2});
    const carrieres = [carriereWithLangue(5, 2)];
    expect(selectedLanguageTarget(r, 1, carrieres, [lemurien, natif])).toBe(3);
  });

  it('origine avec une seule langue automatique ajoute 1 bonus choix', () => {
    // Quand la native = lémurienne → une seule langue auto → bonus +1 choix
    const r = region({langue_native_id: 1});
    expect(selectedLanguageTarget(r, 0, [], [lemurien])).toBe(1);
  });

  it('origine avec deux langues automatiques n\'ajoute pas de bonus choix', () => {
    const r = region({langue_native_id: 2});
    expect(selectedLanguageTarget(r, 0, [], [lemurien, natif])).toBe(0);
  });

  it('retourne 0 sans région', () => {
    expect(selectedLanguageTarget(null, 2, [], [lemurien])).toBe(0);
  });

  it('carrière sans donne_langue ne compte pas', () => {
    const r = region({langue_native_id: 2});
    const carrieres = [carriere(5, 3)];
    expect(selectedLanguageTarget(r, 0, carrieres, [lemurien, natif])).toBe(0);
  });
});
