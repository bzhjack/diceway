import {FormBuilder, FormControl} from '@angular/forms';
import {
  attributValidator,
  attributsFormValidator,
  carriereValidator,
  carrieresFormValidatorFn,
  combatFormValidatorFn,
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

const fb = new FormBuilder();

function ctrl(value: unknown) {
  return new FormControl(value);
}

function makeCombatForm(budget: number, init: number, melee: number, tir: number, defense: number) {
  return fb.group(
    {initiative: [init], melee: [melee], tir: [tir], defense: [defense]},
    {validators: combatFormValidatorFn(budget)},
  );
}

function makeCarrieresForm(budget: number, values: number[]) {
  const carrieres = fb.array(values.map((v) => fb.group({carriere_id: [1], value: [v]})));
  return fb.group({carrieres}, {validators: carrieresFormValidatorFn(budget)});
}

function makeAttributsForm(vigueur: number, agilite: number, aura: number, esprit: number) {
  return fb.group(
    {vigueur: [vigueur], agilite: [agilite], aura: [aura], esprit: [esprit]},
    {validators: attributsFormValidator},
  );
}

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

describe('R-ATTR-1 — attributValidator : chaque attribut est compris entre -1 et 3', () => {
  it('accepte 0 (valeur neutre)', () => expect(attributValidator(ctrl(0))).toBeNull());
  it('accepte -1 (minimum autorisé)', () => expect(attributValidator(ctrl(-1))).toBeNull());
  it('accepte 3 (maximum autorisé)', () => expect(attributValidator(ctrl(3))).toBeNull());
  it('refuse -2 (en dessous du minimum)', () => expect(attributValidator(ctrl(-2))?.['tooSmallAttr']).toBeTruthy());
  it('refuse 4 (au-dessus du maximum)', () => expect(attributValidator(ctrl(4))?.['tooBigAttr']).toBeTruthy());
  it('refuse null (champ obligatoire)', () => expect(attributValidator(ctrl(null))?.['required']).toBeTruthy());
  it('refuse undefined (champ obligatoire)', () => expect(attributValidator(ctrl(undefined))?.['required']).toBeTruthy());
});

// ===========================================================================
// R-ATTR-2 — La somme des 4 attributs ne dépasse pas 4 points
// ===========================================================================

describe('R-ATTR-2 — attributsFormValidator : somme des attributs ≤ 4', () => {
  it('accepte une somme égale à 4 (budget utilisé en entier)', () => {
    expect(makeAttributsForm(1, 1, 1, 1).errors).toBeNull();
  });

  it('accepte une somme inférieure à 4', () => {
    expect(makeAttributsForm(0, 0, 0, 0).errors).toBeNull();
  });

  it('refuse une somme de 5 (dépassement de 1)', () => {
    expect(makeAttributsForm(2, 1, 1, 1).errors?.['attrSumExceeded']).toBe(true);
  });

  it('refuse une somme de 8 (dépassement maximum possible)', () => {
    expect(makeAttributsForm(2, 2, 2, 2).errors?.['attrSumExceeded']).toBe(true);
  });
});

// ===========================================================================
// R-ATTR-3 — Un seul attribut peut descendre à -1
// ===========================================================================

describe('R-ATTR-3 — attributsFormValidator : un seul attribut peut être à -1', () => {
  it('accepte exactement un attribut à -1', () => {
    expect(makeAttributsForm(-1, 1, 1, 1).errors).toBeNull();
  });

  it('refuse deux attributs à -1', () => {
    expect(makeAttributsForm(-1, -1, 0, 0).errors?.['attrTooManyNegative']).toBe(true);
  });

  it('refuse quatre attributs à -1', () => {
    expect(makeAttributsForm(-1, -1, -1, -1).errors?.['attrTooManyNegative']).toBe(true);
  });
});

// ===========================================================================
// R-CARR-1 — Chaque rang de carrière est compris entre 0 et 3
// ===========================================================================

describe('R-CARR-1 — carriereValidator : rang compris entre 0 et 3', () => {
  it('accepte 0 (rang débutant)', () => expect(carriereValidator(ctrl(0))).toBeNull());
  it('accepte 1', () => expect(carriereValidator(ctrl(1))).toBeNull());
  it('accepte 3 (rang maximum)', () => expect(carriereValidator(ctrl(3))).toBeNull());
  it('refuse -1 (rang négatif impossible)', () => expect(carriereValidator(ctrl(-1))?.['tooSmallAttr']).toBeTruthy());
  it('refuse 4 (au-dessus du rang maximum)', () => expect(carriereValidator(ctrl(4))?.['tooBigAttr']).toBeTruthy());
  it('refuse null (champ obligatoire)', () => expect(carriereValidator(ctrl(null))?.['required']).toBeTruthy());
});

// ===========================================================================
// R-CARR-2 — La somme des rangs de carrières ne dépasse pas 4 (budget standard)
// ===========================================================================

describe('R-CARR-2 — carrieresFormValidatorFn : somme des carrières ≤ 4 (budget standard)', () => {
  it('accepte une somme égale à 4 (budget utilisé en entier)', () => {
    expect(makeCarrieresForm(4, [1, 1, 1, 1]).errors).toBeNull();
  });

  it('accepte une somme inférieure à 4', () => {
    expect(makeCarrieresForm(4, [0, 0, 0, 0]).errors).toBeNull();
  });

  it('refuse une somme de 5', () => {
    expect(makeCarrieresForm(4, [2, 1, 1, 1]).errors?.['carrSumExceeded']).toBe(true);
  });

  it('refuse une somme de 8 (rang 2 sur 4 carrières)', () => {
    expect(makeCarrieresForm(4, [2, 2, 2, 2]).errors?.['carrSumExceeded']).toBe(true);
  });

  it('accepte sorcier rang 3 — la somme 3 reste dans le budget', () => {
    expect(makeCarrieresForm(4, [3, 0, 0, 0]).errors).toBeNull();
  });

  it('accepte alchimiste rang 3 — la somme 3 reste dans le budget', () => {
    expect(makeCarrieresForm(4, [3, 0, 0, 0]).errors).toBeNull();
  });
});

// ===========================================================================
// R-CARR-3 — Non-combattant : budget carrières porté à 6
// ===========================================================================

describe('R-CARR-3 — carrieresFormValidatorFn : Non-combattant bénéficie de 6 points de carrières', () => {
  it('accepte une somme de 6 avec budget=6', () => {
    expect(makeCarrieresForm(6, [3, 2, 1, 0]).errors).toBeNull();
  });

  it('accepte une somme de 4 avec budget=6', () => {
    expect(makeCarrieresForm(6, [1, 1, 1, 1]).errors).toBeNull();
  });

  it('refuse une somme de 7 avec budget=6', () => {
    expect(makeCarrieresForm(6, [3, 2, 1, 1]).errors?.['carrSumExceeded']).toBe(true);
  });

  it('refuse une somme de 5 avec budget standard=4', () => {
    expect(makeCarrieresForm(4, [2, 2, 1, 0]).errors?.['carrSumExceeded']).toBe(true);
  });
});

// ===========================================================================
// R-COMBAT-1 — La somme des aptitudes de combat ne dépasse pas 4 (budget standard)
// ===========================================================================

describe('R-COMBAT-1 — combatFormValidatorFn : somme des aptitudes ≤ 4 (budget standard)', () => {
  it('accepte une somme égale à 4', () => {
    expect(makeCombatForm(4, 2, 1, 0, 1).errors).toBeNull();
  });

  it('accepte une somme inférieure à 4', () => {
    expect(makeCombatForm(4, 0, 0, 0, 0).errors).toBeNull();
  });

  it('refuse une somme de 5', () => {
    expect(makeCombatForm(4, 2, 1, 1, 1).errors?.['aptSumExceeded']).toBe(true);
  });

  it('refuse une somme de 8 (tous à 2)', () => {
    expect(makeCombatForm(4, 2, 2, 2, 2).errors?.['aptSumExceeded']).toBe(true);
  });
});

// ===========================================================================
// R-COMBAT-2 — Non-combattant : seulement 2 points d'aptitudes de combat
// ===========================================================================

describe('R-COMBAT-2 — combatFormValidatorFn : Non-combattant limité à 2 points d\'aptitudes de combat', () => {
  it('accepte une somme de 2 avec budget=2', () => {
    expect(makeCombatForm(2, 1, 0, 0, 1).errors).toBeNull();
  });

  it('accepte une somme de 0 avec budget=2', () => {
    expect(makeCombatForm(2, 0, 0, 0, 0).errors).toBeNull();
  });

  it('refuse une somme de 3 avec budget=2', () => {
    expect(makeCombatForm(2, 2, 1, 0, 0).errors?.['aptSumExceeded']).toBe(true);
  });

  it('refuse une somme de 4 (budget standard) avec budget=2', () => {
    expect(makeCombatForm(2, 1, 1, 1, 1).errors?.['aptSumExceeded']).toBe(true);
  });
});

// ===========================================================================
// R-COMBAT-3 — Une seule aptitude de combat peut descendre à -1
// ===========================================================================

describe('R-COMBAT-3 — combatFormValidatorFn : une seule aptitude peut être à -1', () => {
  it('accepte exactement une aptitude à -1', () => {
    expect(makeCombatForm(4, -1, 1, 1, 1).errors).toBeNull();
  });

  it('refuse deux aptitudes à -1 (initiative et mêlée)', () => {
    expect(makeCombatForm(4, -1, -1, 0, 0).errors?.['aptTooManyNegative']).toBe(true);
  });

  it('refuse trois aptitudes à -1', () => {
    expect(makeCombatForm(4, -1, -1, -1, 0).errors?.['aptTooManyNegative']).toBe(true);
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
