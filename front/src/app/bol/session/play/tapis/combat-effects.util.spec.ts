import {describe, expect, it} from 'vitest';
import {CombatEffect, RollContext} from '../../models/combat-effect.model';
import {appliquerEvenement, aSombre, aStabilise, BOUCLIER_DEPENSE, descriptionEffet, doitUnDeDeMalus, effetCoupPrecis, effetInconscient, effetRenversement, effetStabilise, effetSurpris, EFFETS_MODELES, effetsDeLAncienFormat, effetsDeTour, libelleDuree, modificateursPour, sansTerme, nextEffectId, normalizeEffets, SANS_BOUCLIER, sommeModificateurs} from './combat-effects.util';

function effet(over: Partial<CombatEffect> = {}): CombatEffect {
  return {id: 'e-1', origine: 'posture-defensive', porteur: 'hero-1', stat: 'defense', valeur: 1, quand: 'subie', duree: {type: 'debut-tour-porteur'}, manuel: false, ...over};
}

function ctx(over: Partial<RollContext> = {}): RollContext {
  return {jet: 'attaque', attaquant: 'pnj-7', cible: 'hero-1', bouclier: 0, bouclierToutes: 0, ...over};
}

describe('nextEffectId', () => {
  it('starts at e-1 and follows the highest id', () => {
    expect(nextEffectId([])).toBe('e-1');
    expect(nextEffectId([effet({id: 'e-4'}), effet({id: 'e-2'})])).toBe('e-5');
    expect(nextEffectId([effet({id: 'manuel'})])).toBe('e-1');
  });
});

describe('modificateursPour', () => {
  it('turns a defence bonus of the target into a malus on the attack total', () => {
    const terms = modificateursPour([effet({valeur: 1})], ctx());
    expect(terms).toEqual([{effetId: 'e-1', label: '− 1 posture défensive', valeur: -1, tone: 'minus'}]);
  });

  it('turns a defence malus of the target into a bonus on the attack total', () => {
    const terms = modificateursPour([effet({origine: 'posture-offensive', valeur: -1})], ctx());
    expect(terms).toEqual([{effetId: 'e-1', label: '+ 1 posture offensive', valeur: 1, tone: 'plus'}]);
  });

  it("applies the attacker's own attack effects", () => {
    const own = effet({id: 'e-2', origine: 'x', libelle: 'inspiré', porteur: 'pnj-7', stat: 'attaque', quand: 'attaque', valeur: 1});
    expect(modificateursPour([own], ctx())).toEqual([{effetId: 'e-2', label: '+ 1 inspiré', valeur: 1, tone: 'plus'}]);
  });

  it('ignores effects of other cards, other rolls and traces', () => {
    const effets = [
      effet({id: 'e-1', porteur: 'hero-9'}),
      effet({id: 'e-2', stat: 'protection'}),
      effet({id: 'e-3', origine: BOUCLIER_DEPENSE, valeur: 0}),
    ];
    expect(modificateursPour(effets, ctx())).toEqual([]);
  });

  it('keeps an effect limited to one opponent for that opponent only', () => {
    const limited = effet({cible: 'pnj-7'});
    expect(modificateursPour([limited], ctx())).toHaveLength(1);
    expect(modificateursPour([limited], ctx({attaquant: 'pnj-8'}))).toEqual([]);
  });

  it('reads protection and damage effects for a damage roll', () => {
    const protection = effet({id: 'e-1', origine: 'x', libelle: 'armure bénie', stat: 'protection', valeur: 1});
    const degats = effet({id: 'e-2', origine: 'x', libelle: 'rage', porteur: 'pnj-7', stat: 'degats', quand: 'attaque', valeur: 2});
    expect(modificateursPour([protection, degats], ctx({jet: 'degats'})).map((t) => t.valeur)).toEqual([-1, 2]);
    expect(modificateursPour([protection, degats], ctx())).toEqual([]);
  });

  it("adds the target's small shield from the sheet, but only for an attack roll", () => {
    expect(modificateursPour([], ctx({bouclier: 1}))).toEqual([{effetId: null, label: '− 1 bouclier', valeur: -1, tone: 'minus'}]);
    expect(modificateursPour([], ctx({bouclier: 1, jet: 'degats'}))).toEqual([]);
  });

  it('drops the shield once spent this round, or when the target has lost it', () => {
    const spent = effet({origine: BOUCLIER_DEPENSE, valeur: 0, duree: {type: 'fin-round'}});
    const lost = effet({origine: SANS_BOUCLIER, valeur: 0});
    expect(modificateursPour([spent], ctx({bouclier: 1}))).toEqual([]);
    expect(modificateursPour([lost], ctx({bouclier: 1}))).toEqual([]);
  });

  it('sums the contributions', () => {
    const terms = modificateursPour([effet({valeur: 2, origine: 'defense-totale'})], ctx({bouclier: 1}));
    expect(sommeModificateurs(terms)).toBe(-3);
  });
});

describe('modificateursPour : grand bouclier, noms, effets d’action', () => {
  it('gives back the defence a grand shield adds, once its bearer has lost the benefit of the shield', () => {
    const perdu = effet({origine: SANS_BOUCLIER, valeur: 0});
    expect(modificateursPour([perdu], ctx({bouclierToutes: 1}))).toEqual([{effetId: null, label: '+ 1 grand bouclier perdu', valeur: 1, tone: 'plus'}]);
    expect(modificateursPour([], ctx({bouclierToutes: 1}))).toEqual([]);
    expect(modificateursPour([perdu], ctx({bouclierToutes: 1, jet: 'degats'}))).toEqual([]);
  });

  it('keeps the large shield against every attack of the round: a spent small shield does not take it away', () => {
    const depense = effet({origine: BOUCLIER_DEPENSE, valeur: 0, duree: {type: 'fin-round'}});
    expect(modificateursPour([depense], ctx({bouclierToutes: 1}))).toEqual([]);
  });

  it('names the bearer of an effect when the names are known', () => {
    const terms = modificateursPour([effet({valeur: 1})], ctx({noms: {'hero-1': 'Dogon'}}));
    expect(terms[0].label).toBe('− 1 posture défensive (Dogon)');
  });

  it('does not count an action effect in a roll total', () => {
    const malus = effet({origine: 'renversement', stat: 'action', quand: 'attaque', valeur: -1, porteur: 'pnj-7'});
    expect(modificateursPour([malus], ctx())).toEqual([]);
  });
});

describe('appliquerEvenement', () => {
  it('debut-tour: ends the effects that last until the bearer next turn, for that card only', () => {
    const effets = [effet({id: 'e-1'}), effet({id: 'e-2', porteur: 'pnj-7'}), effet({id: 'e-3', duree: {type: 'combat'}})];
    expect(appliquerEvenement(effets, {type: 'debut-tour', carte: 'hero-1'}).map((e) => e.id)).toEqual(['e-2', 'e-3']);
  });

  it('debut-tour: also ends a parade (one use) that was not used', () => {
    const parade = effet({origine: 'parade', duree: {type: 'usages', restants: 1, expireAuTour: true}});
    expect(appliquerEvenement([parade], {type: 'debut-tour', carte: 'hero-1'})).toEqual([]);
  });

  it('fin-tour: creates the effects of the turn with fresh ids', () => {
    const crees = effetsDeTour('hero-1', {posture: 'defensive', defenseTotale: false});
    const apres = appliquerEvenement([], {type: 'fin-tour', carte: 'hero-1', crees});
    expect(apres).toEqual([effet({id: 'e-1', origine: 'posture-defensive', valeur: 1})]);
  });

  it('fin-tour: replaces what the card already carried from an earlier turn instead of doubling it', () => {
    const crees = effetsDeTour('hero-1', {posture: 'defensive', defenseTotale: false});
    const once = appliquerEvenement([], {type: 'fin-tour', carte: 'hero-1', crees});
    const twice = appliquerEvenement(once, {type: 'fin-tour', carte: 'hero-1', crees});
    expect(twice).toHaveLength(1);
  });

  it('fin-tour: ends the one-action effects of the card (renversement)', () => {
    const renverse = effet({origine: 'renversement', stat: 'action', quand: 'attaque', valeur: -1, duree: {type: 'action-porteur'}});
    expect(appliquerEvenement([renverse], {type: 'fin-tour', carte: 'hero-1', crees: []})).toEqual([]);
  });

  it('jet-attaque: spends the small shield of the target once, without doubling the trace', () => {
    const once = appliquerEvenement([], {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1', petitBouclier: true});
    expect(once).toEqual([effet({id: 'e-1', origine: BOUCLIER_DEPENSE, valeur: 0, duree: {type: 'fin-round'}})]);
    expect(appliquerEvenement(once, {type: 'jet-attaque', attaquant: 'pnj-8', cible: 'hero-1', petitBouclier: true})).toHaveLength(1);
  });

  it('jet-attaque: leaves no trace on a target without a small shield', () => {
    expect(appliquerEvenement([], {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1', petitBouclier: false})).toEqual([]);
  });

  it('jet-attaque: uses up one use of a limited effect of the target, then removes it', () => {
    const parade = effet({origine: 'parade', duree: {type: 'usages', restants: 2}});
    const afterOne = appliquerEvenement([parade], {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1', petitBouclier: false});
    expect(afterOne.find((e) => e.origine === 'parade')?.duree).toEqual({type: 'usages', restants: 1});
    const afterTwo = appliquerEvenement(afterOne, {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1', petitBouclier: false});
    expect(afterTwo.find((e) => e.origine === 'parade')).toBeUndefined();
  });

  it('jet-attaque: only uses up the defence effects that concern this attacker', () => {
    const contreUnAutre = effet({id: 'e-1', origine: 'parade', cible: 'pnj-8', duree: {type: 'usages', restants: 1}});
    const contreTous = effet({id: 'e-2', origine: 'parade', duree: {type: 'usages', restants: 1}});
    const protection = effet({id: 'e-3', origine: 'x', stat: 'protection', duree: {type: 'usages', restants: 1}});
    const apres = appliquerEvenement([contreUnAutre, contreTous, protection], {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1', petitBouclier: true});
    expect(apres.map((e) => e.id).sort()).toEqual(['e-1', 'e-3', 'e-4']);
  });

  it('jet-attaque: leaves the effects of other targets alone', () => {
    const other = effet({porteur: 'hero-2', duree: {type: 'usages', restants: 1}});
    const apres = appliquerEvenement([other], {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1', petitBouclier: false});
    expect(apres.find((e) => e.id === 'e-1')?.duree).toEqual({type: 'usages', restants: 1});
  });

  it('nouveau-round: ends the end-of-round effects and keeps the others', () => {
    const effets = [effet({id: 'e-1', duree: {type: 'fin-round'}}), effet({id: 'e-2'}), effet({id: 'e-3', duree: {type: 'combat'}})];
    expect(appliquerEvenement(effets, {type: 'nouveau-round'}).map((e) => e.id)).toEqual(['e-2', 'e-3']);
  });

  it('ajout-manuel and retrait-manuel: the GM adds then removes an effect', () => {
    const {id: _id, ...nouveau} = effet({origine: 'main', libelle: 'sol glissant', valeur: -1});
    const added = appliquerEvenement([], {type: 'ajout-manuel', effet: nouveau});
    expect(added).toEqual([{...nouveau, id: 'e-1', manuel: true}]);
    expect(appliquerEvenement(added, {type: 'retrait-manuel', id: 'e-1'})).toEqual([]);
  });

  it('carte-retiree: drops what the card carries and what targets it', () => {
    const effets = [effet({id: 'e-1'}), effet({id: 'e-2', porteur: 'pnj-7', cible: 'hero-1'}), effet({id: 'e-3', porteur: 'pnj-8'})];
    expect(appliquerEvenement(effets, {type: 'carte-retiree', carte: 'hero-1'}).map((e) => e.id)).toEqual(['e-3']);
  });

  it('never mutates its input', () => {
    const effets = Object.freeze([Object.freeze(effet())]);
    expect(() => appliquerEvenement(effets, {type: 'debut-tour', carte: 'hero-1'})).not.toThrow();
    expect(() => appliquerEvenement(effets, {type: 'fin-tour', carte: 'hero-1', crees: effetsDeTour('hero-1', {posture: 'offensive', defenseTotale: true})})).not.toThrow();
  });
});

describe('effetsDeTour', () => {
  it('gives nothing for a turn without a lasting choice', () => {
    expect(effetsDeTour('hero-1', {posture: null, defenseTotale: false})).toEqual([]);
    expect(effetsDeTour('hero-1', {posture: 'none', defenseTotale: false})).toEqual([]);
  });

  it('gives the defence of each posture of the scale', () => {
    const valeur = (posture: string) => effetsDeTour('hero-1', {posture, defenseTotale: false})[0]?.valeur;
    expect([valeur('defensive'), valeur('offensive'), valeur('intrepid')]).toEqual([1, -1, -2]);
  });

  it('makes an intrepid attack lose the shield', () => {
    const origines = effetsDeTour('hero-1', {posture: 'intrepid', defenseTotale: false}).map((e) => e.origine);
    expect(origines).toEqual(['attaque-intrepide', SANS_BOUCLIER]);
  });

  it('gives the parade of a two-weapon fight one use, expiring with the next turn', () => {
    const [parade] = effetsDeTour('hero-1', {posture: 'dual-parry', defenseTotale: false});
    expect(parade).toMatchObject({origine: 'parade', valeur: 1, duree: {type: 'usages', restants: 1, expireAuTour: true}});
  });

  it('gives +2 for a total defence, stacking with a parade', () => {
    const effets = effetsDeTour('hero-1', {posture: 'dual-parry', defenseTotale: true});
    expect(effets.map((e) => [e.origine, e.valeur])).toEqual([['parade', 1], ['defense-totale', 2]]);
  });
});

describe('normalizeEffets', () => {
  it('keeps valid effects and drops the invalid ones', () => {
    const valide = effet({id: 'e-2'});
    expect(normalizeEffets([valide, 'x', null, {...effet({id: 'e-3'}), stat: 'magie'}, {...effet({id: 'e-4'}), valeur: 99}])).toEqual([valide]);
  });

  it('returns nothing for something that is not a list', () => {
    expect(normalizeEffets('x')).toEqual([]);
    expect(normalizeEffets(undefined)).toEqual([]);
    expect(normalizeEffets({0: effet()})).toEqual([]);
  });

  it('drops a repeated id and keeps at most 200 effects', () => {
    expect(normalizeEffets([effet(), effet({origine: 'autre'})])).toHaveLength(1);
    const beaucoup = Array.from({length: 500}, (_, i) => effet({id: `e-${i + 1}`}));
    expect(normalizeEffets(beaucoup)).toHaveLength(200);
  });

  it('keeps the optional fields, trims the label to 60 characters', () => {
    const manuel = effet({manuel: true, cible: 'pnj-7', libelle: 'x'.repeat(100), duree: {type: 'usages', restants: 2, expireAuTour: true}});
    const [garde] = normalizeEffets([manuel]);
    expect(garde.cible).toBe('pnj-7');
    expect(garde.libelle).toHaveLength(60);
    expect(garde.duree).toEqual({type: 'usages', restants: 2, expireAuTour: true});
  });
});

describe('effetsDeLAncienFormat', () => {
  it('turns the total-defence cards and the attacked cards into effects', () => {
    expect(effetsDeLAncienFormat({defense_totale: ['hero-1', 'hero-1', 4], attaquees: ['pnj-7']})).toEqual([
      effet({id: 'e-1', origine: 'defense-totale', porteur: 'hero-1', valeur: 2}),
      effet({id: 'e-2', origine: BOUCLIER_DEPENSE, porteur: 'pnj-7', valeur: 0, duree: {type: 'fin-round'}}),
    ]);
  });

  it('gives nothing when the old fields are missing or malformed', () => {
    expect(effetsDeLAncienFormat({})).toEqual([]);
    expect(effetsDeLAncienFormat({defense_totale: 'x', attaquees: null})).toEqual([]);
  });
});

describe('libelleDuree', () => {
  it('says how long an effect lasts, in plain French', () => {
    expect(libelleDuree({type: 'usages', restants: 1})).toBe('1 attaque subie');
    expect(libelleDuree({type: 'usages', restants: 2})).toBe('2 attaques subies');
    expect(libelleDuree({type: 'usages', restants: 1, expireAuTour: true})).toBe('1 attaque subie, ou jusqu’à son prochain tour');
    expect(libelleDuree({type: 'fin-round'})).toBe('jusqu’à la fin du round');
    expect(libelleDuree({type: 'debut-tour-porteur'})).toBe('jusqu’à son prochain tour');
    expect(libelleDuree({type: 'action-porteur'})).toBe('jusqu’à sa prochaine action');
    expect(libelleDuree({type: 'combat'})).toBe('jusqu’à la fin du combat');
  });
});

describe('EFFETS_MODELES', () => {
  it('builds manual effects for a given card, all within the bounds the backend accepts', () => {
    for (const modele of EFFETS_MODELES) {
      const cree = modele.creer('hero-1');
      expect(cree.porteur).toBe('hero-1');
      expect(Math.abs(cree.valeur)).toBeLessThanOrEqual(20);
      expect(cree.manuel).toBe(true);
    }
    expect(EFFETS_MODELES.map((m) => m.id)).toEqual(['defense-round', 'de-malus-action', 'malus-attaque-round', 'action-perdue']);
  });
});

describe('doitUnDeDeMalus', () => {
  const deMalus = EFFETS_MODELES.find((m) => m.id === 'de-malus-action')!;
  const actionPerdue = EFFETS_MODELES.find((m) => m.id === 'action-perdue')!;

  it('is true for the card that carries « dé de malus à sa prochaine action »', () => {
    const effets = [{...deMalus.creer('hero-1'), id: 'e-1'}];
    expect(doitUnDeDeMalus(effets, 'hero-1')).toBe(true);
    expect(doitUnDeDeMalus(effets, 'pnj-7')).toBe(false);
  });

  it('is false for the other effects, even those on the next action', () => {
    expect(doitUnDeDeMalus([{...actionPerdue.creer('hero-1'), id: 'e-1'}, effet({id: 'e-2', valeur: -1, stat: 'attaque'})], 'hero-1')).toBe(false);
    expect(doitUnDeDeMalus([], 'hero-1')).toBe(false);
  });
});

describe('descriptionEffet', () => {
  it('writes a modifier with its sign, and a trace with its label only', () => {
    expect(descriptionEffet(effet({valeur: 1}))).toBe('+ 1 posture défensive');
    expect(descriptionEffet(effet({valeur: -2, origine: 'attaque-intrepide'}))).toBe('− 2 attaque intrépide');
    expect(descriptionEffet(effet({origine: BOUCLIER_DEPENSE, valeur: 0}))).toBe('bouclier dépensé');
    expect(descriptionEffet(effet({origine: SANS_BOUCLIER, valeur: 0}))).toBe('sans bouclier');
    expect(descriptionEffet(effet({origine: 'renversement', libelle: 'dé de malus à la prochaine action', stat: 'action', valeur: -1}))).toBe('dé de malus à la prochaine action');
  });
});

describe('identifiants des effets créés', () => {
  it('uses the generator it is given, so an id is never reused after an effect is consumed', () => {
    const parade = effet({id: 'e-1', origine: 'parade', duree: {type: 'usages', restants: 1}});
    const apres = appliquerEvenement([parade], {type: 'jet-attaque', attaquant: 'pnj-7', cible: 'hero-1', petitBouclier: true}, () => 'e-unique');
    expect(apres.map((e) => e.id)).toEqual(['e-unique']);
    expect(apres.some((e) => e.id === 'e-1')).toBe(false);
  });
});

describe('sansTerme', () => {
  const termes = [
    {effetId: 'e-1', label: '− 1 posture défensive', valeur: -1, tone: 'minus'},
    {effetId: null, label: '− 1 bouclier', valeur: -1, tone: 'minus'},
    {effetId: 'e-2', label: '+ 1 malus', valeur: 1, tone: 'plus'},
  ] as const;

  it('drops the term of a removed effect, so a frozen roll recomputes at once', () => {
    expect(sansTerme(termes, 'e-1').map((t) => t.effetId)).toEqual([null, 'e-2']);
    expect(sommeModificateurs(sansTerme(termes, 'e-1'))).toBe(0);
  });

  it('keeps everything for an unknown id, and never touches the shield of the sheet', () => {
    expect(sansTerme(termes, 'e-9')).toEqual(termes);
  });
});

describe('effets des options héroïques', () => {
  it('leaves a precise blow malus die on the target until the end of the fight', () => {
    const effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetCoupPrecis('pnj-7')}, () => 'e-1');
    expect(doitUnDeDeMalus(effets, 'pnj-7')).toBe(true);
    const apresSonTour = appliquerEvenement(effets, {type: 'fin-tour', carte: 'pnj-7', crees: []});
    expect(doitUnDeDeMalus(appliquerEvenement(apresSonTour, {type: 'nouveau-round'}), 'pnj-7')).toBe(true);
    expect(sommeModificateurs(modificateursPour(effets, {jet: 'attaque', attaquant: 'pnj-7', cible: 'hero-1', bouclier: 0, bouclierToutes: 0}))).toBe(0);
  });

  it('gives a knocked-down target a malus die for its next action only', () => {
    const effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetRenversement('pnj-7')}, () => 'e-1');
    expect(doitUnDeDeMalus(effets, 'pnj-7')).toBe(true);
    expect(doitUnDeDeMalus(appliquerEvenement(effets, {type: 'fin-tour', carte: 'pnj-7', crees: []}), 'pnj-7')).toBe(false);
  });
});

describe('effetSurpris', () => {
  it('takes the shield away from a surprised hero until the end of the round', () => {
    const effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetSurpris('hero-1')}, () => 'e-1');
    const contexte = {jet: 'attaque', attaquant: 'pnj-7', cible: 'hero-1', bouclier: 1, bouclierToutes: 0} as const;
    expect(sommeModificateurs(modificateursPour(effets, contexte))).toBe(0);
    expect(sommeModificateurs(modificateursPour([], contexte))).toBe(-1);
    expect(appliquerEvenement(effets, {type: 'nouveau-round'})).toEqual([]);
  });
});

describe('effetInconscient', () => {
  it('remembers for the whole fight that a hero chose to pass out', () => {
    const effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetInconscient('hero-1')}, () => 'e-1');
    expect(aSombre(effets, 'hero-1')).toBe(true);
    expect(aSombre(effets, 'hero-2')).toBe(false);
    const plusTard = appliquerEvenement(appliquerEvenement(effets, {type: 'nouveau-round'}), {type: 'fin-tour', carte: 'hero-1', crees: []});
    expect(aSombre(plusTard, 'hero-1')).toBe(true);
  });
});

describe('effetStabilise', () => {
  it('remembers for the whole fight that a dying hero was stabilized', () => {
    const effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetStabilise('hero-1')}, () => 'e-1');
    expect(aStabilise(effets, 'hero-1')).toBe(true);
    expect(aStabilise(effets, 'hero-2')).toBe(false);
    const plusTard = appliquerEvenement(appliquerEvenement(effets, {type: 'nouveau-round'}), {type: 'fin-tour', carte: 'hero-1', crees: []});
    expect(aStabilise(plusTard, 'hero-1')).toBe(true);
  });
});
