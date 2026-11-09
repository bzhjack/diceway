import {describe, expect, it} from 'vitest';
import {CombatEffect, RollContext} from '../../models/combat-effect.model';
import {annonceEffetsTombes, effetsTombes, desDeFoi, effetDeFoi, aDejaFeinte, appliquerEvenement, aUneTraceDeChute, dureeLibre, dureesLibres, effetActionSautee, effetAssomme, effetLibre, effetsDeLaFrise, sansTracesDeChute, effetParade, aSombre, aStabilise, effetFeinte, degatsMainsNues, effetDegatsMainsNues, BOUCLIER_DEPENSE, descriptionEffet, doitUnDeDeMalus, effetActionPerdue, effetCoupPrecis, effetInconscient, effetParalyse, effetRenversement, estParalyse, effetStabilise, effetSurpris, EFFETS_MODELES, effetsDeLAncienFormat, effetsDeTour, libelleDuree, modificateursPour, sansTerme, nextEffectId, normalizeEffets, perdSonAction, SANS_BOUCLIER, sommeModificateurs, effetRechargement, enRechargement} from './combat-effects.util';

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
  it('cumule la posture et la parade à deux armes', () => {
    const crees = effetsDeTour('hero-1', {posture: 'offensive', special: 'dual-parry', defenseTotale: false});
    expect(crees.map((e) => e.valeur)).toEqual([-1, 1]);
    expect(crees[1].duree).toEqual({type: 'usages', restants: 1, expireAuTour: true});
  });

  it("le défaut de l'armure ne crée pas d'effet de défense", () => {
    expect(effetsDeTour('hero-1', {posture: 'defensive', special: 'armor-chink', defenseTotale: false}).map((e) => e.valeur)).toEqual([1]);
  });

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

  it('keeps a duration in rounds between 1 and 20, as the backend does', () => {
    const deuxRounds = effet({id: 'e-2', duree: {type: 'rounds', restants: 2}});
    expect(normalizeEffets([deuxRounds, effet({id: 'e-3', duree: {type: 'rounds', restants: 0}}), {...effet({id: 'e-4'}), duree: {type: 'rounds'}}])).toEqual([deuxRounds]);
    expect(normalizeEffets([effet({duree: {type: 'rounds', restants: 1, expireAuTour: true} as never})])[0].duree).toEqual({type: 'rounds', restants: 1});
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
    expect(libelleDuree({type: 'rounds', restants: 2})).toBe('encore 2 rounds');
    expect(libelleDuree({type: 'rounds', restants: 1})).toBe('jusqu’à la fin du round');
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

  it('lets a regenerating demon shake off a precise blow after 2 rounds', () => {
    const effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetCoupPrecis('demon-4', true)}, () => 'e-1');
    expect(effets[0].duree).toEqual({type: 'rounds', restants: 2});
    expect(doitUnDeDeMalus(effets, 'demon-4')).toBe(true);
    const round2 = appliquerEvenement(appliquerEvenement(effets, {type: 'fin-tour', carte: 'demon-4', crees: []}), {type: 'nouveau-round'});
    expect(doitUnDeDeMalus(round2, 'demon-4')).toBe(true);
    expect(round2[0].duree).toEqual({type: 'rounds', restants: 1});
    expect(doitUnDeDeMalus(appliquerEvenement(round2, {type: 'nouveau-round'}), 'demon-4')).toBe(false);
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

describe('effetDegatsMainsNues', () => {
  it('adds up the bare-handed damage taken by a card, for the whole fight, without weighing on any roll', () => {
    let effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetDegatsMainsNues('hero-1', 3)}, () => 'e-1');
    effets = appliquerEvenement(effets, {type: 'ajout-manuel', effet: effetDegatsMainsNues('hero-1', 2)}, () => 'e-2');
    effets = appliquerEvenement(appliquerEvenement(effets, {type: 'nouveau-round'}), {type: 'fin-tour', carte: 'hero-1', crees: []});
    expect(degatsMainsNues(effets, 'hero-1')).toBe(5);
    expect(degatsMainsNues(effets, 'hero-2')).toBe(0);
    const contexte = {jet: 'degats' as const, attaquant: 'pnj-1', cible: 'hero-1', bouclier: 0, bouclierToutes: 0};
    expect(modificateursPour(effets, contexte)).toEqual([]);
  });
});

describe('effetFeinte', () => {
  it('remembers a feint against one opponent, for that attacker only', () => {
    const effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetFeinte('pnj-1', 'hero-1', 'Voleur')}, () => 'e-1');
    expect(aDejaFeinte(effets, 'pnj-1', 'hero-1')).toBe(true);
    expect(aDejaFeinte(effets, 'pnj-1', 'hero-2')).toBe(false);
    expect(aDejaFeinte(effets, 'pnj-2', 'hero-1')).toBe(false);
    const contexte = {jet: 'attaque' as const, attaquant: 'hero-1', cible: 'pnj-1', bouclier: 0, bouclierToutes: 0};
    expect(modificateursPour(effets, contexte)).toEqual([]);
  });
});

describe('effetParade', () => {
  it('breaks the shield for the whole fight, or leaves a broken-weapon trace', () => {
    const bouclier = effetParade('hero-1', true);
    expect([bouclier.origine, bouclier.libelle, bouclier.duree]).toEqual([SANS_BOUCLIER, 'bouclier brisé', {type: 'combat'}]);
    const arme = effetParade('hero-1', false);
    expect([arme.origine, arme.libelle, arme.valeur]).toEqual(['arme-brisee', 'arme brisée', 0]);
  });
});

describe('perdSonAction', () => {
  it('« Juste une égratignure » (ou « Perd sa prochaine action » posé à la main) : la carte perd son action', () => {
    const effets = [{...effetActionPerdue('hero-1'), id: 'e-1'}];
    expect(perdSonAction(effets, 'hero-1')).toBe(true);
    expect(perdSonAction(effets, 'pnj-7')).toBe(false);
  });

  it('pas pour un dé de malus à sa prochaine action, qui laisse agir', () => {
    expect(perdSonAction([{...effetRenversement('hero-1'), id: 'e-1'}], 'hero-1')).toBe(false);
    expect(perdSonAction([], 'hero-1')).toBe(false);
  });
});

describe('effetParalyse', () => {
  it('paralyses the target until the GM removes it, and recalls what the book says', () => {
    const cree = effetParalyse('hero-1');
    expect(cree).toMatchObject({porteur: 'hero-1', stat: 'action', duree: {type: 'combat'}, manuel: true});
    expect(cree.libelle!.length).toBeLessThanOrEqual(60);
    expect(cree.libelle).toContain('paralysé');
    expect(cree.libelle).toContain('heure');
    const effets = appliquerEvenement([], {type: 'ajout-manuel', effet: cree}, () => 'e-1');
    expect(estParalyse(effets, 'hero-1')).toBe(true);
    expect(estParalyse(appliquerEvenement(effets, {type: 'nouveau-round'}), 'hero-1')).toBe(true);
    expect(estParalyse(appliquerEvenement(effets, {type: 'retrait-manuel', id: 'e-1'}), 'hero-1')).toBe(false);
    expect(estParalyse(effets, 'hero-2')).toBe(false);
    expect(sommeModificateurs(modificateursPour(effets, {jet: 'attaque', attaquant: 'pnj-7', cible: 'hero-1', bouclier: 0, bouclierToutes: 0}))).toBe(0);
  });
});

describe('effetLibre', () => {
  it('a defence or protection effect plays when its bearer is attacked; attack and damage when he attacks', () => {
    expect(effetLibre({porteur: 'hero-1', libelle: 'à couvert', stat: 'defense', valeur: 2, duree: {type: 'fin-round'}})).toEqual({
      origine: 'manuel',
      libelle: 'à couvert',
      porteur: 'hero-1',
      stat: 'defense',
      valeur: 2,
      quand: 'subie',
      duree: {type: 'fin-round'},
      manuel: true,
    });
    expect(effetLibre({porteur: 'pnj-7', libelle: '', stat: 'protection', valeur: -1, duree: {type: 'combat'}})).toMatchObject({quand: 'subie', libelle: 'protection'});
    expect(effetLibre({porteur: 'pnj-7', libelle: '  ', stat: 'attaque', valeur: -2, duree: {type: 'rounds', restants: 3}})).toMatchObject({quand: 'attaque', libelle: 'attaque', duree: {type: 'rounds', restants: 3}});
    expect(effetLibre({porteur: 'pnj-7', libelle: 'rage', stat: 'degats', valeur: 1, duree: {type: 'debut-tour-porteur'}})).toMatchObject({quand: 'attaque', stat: 'degats'});
  });

  it('enters the rolls like the other effects', () => {
    const effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetLibre({porteur: 'hero-1', libelle: 'à couvert', stat: 'defense', valeur: 2, duree: {type: 'fin-round'}})}, () => 'e-1');
    expect(sommeModificateurs(modificateursPour(effets, ctx()))).toBe(-2);
  });

  it('an action effect is a malus die on his next rolls, whatever the value', () => {
    const cree = effetLibre({porteur: 'hero-1', libelle: '', stat: 'action', valeur: 3, duree: {type: 'combat'}});
    expect(cree).toMatchObject({stat: 'action', valeur: -1, libelle: 'dé de malus', duree: {type: 'combat'}});
    expect(doitUnDeDeMalus([{...cree, id: 'e-1'}], 'hero-1')).toBe(true);
  });

  it('keeps the value within −20 and +20 and the label within 60 characters', () => {
    const cree = effetLibre({porteur: 'hero-1', libelle: 'x'.repeat(80), stat: 'attaque', valeur: 40, duree: {type: 'combat'}});
    expect(cree.valeur).toBe(20);
    expect(cree.libelle).toHaveLength(60);
    expect(normalizeEffets([{...cree, id: 'e-1'}])).toHaveLength(1);
  });

  it('a number of attacks suffered is only offered for defence, the only effect they use up', () => {
    expect(dureesLibres('defense').map((d) => d.type)).toContain('usages');
    expect(dureesLibres('attaque').map((d) => d.type)).not.toContain('usages');
    expect(dureesLibres('action').map((d) => d.type)).toEqual(['action-porteur', 'fin-round', 'debut-tour-porteur', 'rounds', 'combat']);
  });
});

describe('sansTracesDeChute', () => {
  it('forgets that a hero passed out, was stabilised or knocked out, once he is back on his feet', () => {
    const effets = [
      {...effetInconscient('hero-1'), id: 'e-1'},
      {...effetStabilise('hero-1'), id: 'e-2'},
      {...effetAssomme('hero-1'), id: 'e-3'},
      {...effetDegatsMainsNues('hero-1', 3), id: 'e-4'},
      {...effetInconscient('hero-2'), id: 'e-5'},
    ];
    expect(aUneTraceDeChute(effets, 'hero-1')).toBe(true);
    const apres = sansTracesDeChute(effets, ['hero-1']);
    expect(apres.map((e) => e.id)).toEqual(['e-4', 'e-5']);
    expect(aSombre(apres, 'hero-1')).toBe(false);
    expect(aStabilise(apres, 'hero-1')).toBe(false);
    expect(aUneTraceDeChute(apres, 'hero-1')).toBe(false);
  });

  it('returns the same list when there is nothing to forget', () => {
    const effets = [{...effetInconscient('hero-2'), id: 'e-1'}];
    expect(sansTracesDeChute(effets, ['hero-1'])).toBe(effets);
  });
});

describe('effetActionSautee', () => {
  it('is a trace shown on the frieze until the turn of its bearer comes back', () => {
    const trace = {...effetActionSautee('hero-1'), id: 'e-1'};
    expect(trace).toMatchObject({porteur: 'hero-1', valeur: 0, duree: {type: 'debut-tour-porteur'}});
    expect(perdSonAction([trace], 'hero-1')).toBe(false);
    expect(effetsDeLaFrise([trace, effet({id: 'e-2', origine: BOUCLIER_DEPENSE, valeur: 0})], 'hero-1')).toEqual(['a perdu son action (juste une égratignure) · jusqu’à son prochain tour']);
    expect(effetsDeLaFrise([effet()], 'hero-1')).toEqual(['posture défensive · jusqu’à son prochain tour']);
  });
});

describe('dureeLibre', () => {
  it('counts rounds and attacks suffered from 1 to 20, the other durations have no number', () => {
    expect(dureeLibre('rounds', 3)).toEqual({type: 'rounds', restants: 3});
    expect(dureeLibre('usages', 40)).toEqual({type: 'usages', restants: 20});
    expect(dureeLibre('usages', 0)).toEqual({type: 'usages', restants: 1});
    expect(dureeLibre('combat', 5)).toEqual({type: 'combat'});
  });
});

describe('effetDeFoi / desDeFoi (livre p. 146)', () => {
  it("gives a bonus or a malus die to the next action of the card, named after the priest", () => {
    expect(effetDeFoi('pnj-7', 'malus', 'Bellys')).toEqual({
      origine: 'de-foi-malus', libelle: 'dé de malus (foi de Bellys)', porteur: 'pnj-7', stat: 'action', valeur: -1, quand: 'attaque', duree: {type: 'action-porteur'}, manuel: true,
    });
    expect(effetDeFoi('hero-1', 'bonus', 'Bellys')).toMatchObject({origine: 'de-foi-bonus', libelle: 'dé de bonus (foi de Bellys)', valeur: 1});
  });

  it('counts the faith dice a card owes, which stack', () => {
    const effets = [
      {...effetDeFoi('hero-1', 'bonus', 'A'), id: 'e-1'},
      {...effetDeFoi('hero-1', 'bonus', 'B'), id: 'e-2'},
      {...effetDeFoi('hero-1', 'malus', 'C'), id: 'e-3'},
      {...effetDeFoi('pnj-2', 'malus', 'A'), id: 'e-4'},
    ];
    expect(desDeFoi(effets, 'hero-1')).toEqual({bonus: 2, malus: 1});
    expect(desDeFoi(effets, 'creature-3')).toEqual({bonus: 0, malus: 0});
  });

  it('falls at the end of the next turn of its bearer, and survives a reload', () => {
    const effets = [{...effetDeFoi('hero-1', 'bonus', 'A'), id: 'e-1'}];
    expect(appliquerEvenement(effets, {type: 'fin-tour', carte: 'hero-1', crees: []})).toEqual([]);
    expect(normalizeEffets(effets)).toEqual(effets);
    expect(doitUnDeDeMalus([{...effetDeFoi('hero-1', 'malus', 'A'), id: 'e-1'}], 'hero-1')).toBe(false);
  });
});

describe('notes d’armes : le fléau et l’arbalète (livre p. 50)', () => {
  it('le fléau ignore le petit bouclier de la cible', () => {
    expect(modificateursPour([], ctx({bouclier: 1, ignoreBouclier: true}))).toEqual([]);
  });

  it('le fléau rend le grand bouclier, déjà compté dans la défense de la cible', () => {
    expect(modificateursPour([], ctx({bouclierToutes: 1, ignoreBouclier: true}))).toEqual([{effetId: null, label: '+ 1 grand bouclier ignoré', valeur: 1, tone: 'plus'}]);
  });

  it('un grand bouclier déjà perdu ne se rend qu’une fois', () => {
    const perdu = effet({origine: SANS_BOUCLIER, valeur: 0});
    expect(modificateursPour([perdu], ctx({bouclierToutes: 1, ignoreBouclier: true}))).toEqual([{effetId: null, label: '+ 1 grand bouclier perdu', valeur: 1, tone: 'plus'}]);
  });

  it('les autres défenses de la cible jouent toujours contre le fléau', () => {
    const terms = modificateursPour([effet({valeur: 2, origine: 'defense-totale'})], ctx({bouclier: 1, ignoreBouclier: true}));
    expect(sommeModificateurs(terms)).toBe(-2);
  });

  it('l’arbalète se recharge pendant le round qui suit le tir, et resservira au suivant', () => {
    const tir = appliquerEvenement([], {type: 'ajout-manuel', effet: effetRechargement('pnj-7', 'Arbalète', 1)});
    expect(enRechargement(tir, 'pnj-7', 'Arbalète')).toBe(true);
    const roundSuivant = appliquerEvenement(tir, {type: 'nouveau-round'});
    expect(enRechargement(roundSuivant, 'pnj-7', 'Arbalète')).toBe(true);
    expect(enRechargement(appliquerEvenement(roundSuivant, {type: 'nouveau-round'}), 'pnj-7', 'Arbalète')).toBe(false);
  });

  it('l’arbalète lourde demande 2 rounds complets', () => {
    let effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetRechargement('hero-1', 'Arbalète lourde', 2)});
    effets = appliquerEvenement(effets, {type: 'nouveau-round'});
    effets = appliquerEvenement(effets, {type: 'nouveau-round'});
    expect(enRechargement(effets, 'hero-1', 'Arbalète lourde')).toBe(true);
    expect(enRechargement(appliquerEvenement(effets, {type: 'nouveau-round'}), 'hero-1', 'Arbalète lourde')).toBe(false);
  });

  it('seule l’arme qui a tiré se recharge, et seulement pour son porteur', () => {
    const effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetRechargement('hero-1', 'Arbalète', 1)});
    expect(enRechargement(effets, 'hero-1', 'Arc')).toBe(false);
    expect(enRechargement(effets, 'hero-2', 'Arbalète')).toBe(false);
  });

  it('un nom trop long est coupé comme le serveur le garde, et l’arme se reconnaît encore', () => {
    const nom = 'Arbalète de siège des remparts de Satarla, modèle à double arc';
    const effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetRechargement('hero-1', nom, 1)});
    const garde = effets.map((e) => ({...e, libelle: e.libelle?.slice(0, 60)}));
    expect(enRechargement(garde, 'hero-1', nom)).toBe(true);
  });

  it('le rechargement se voit sur la frise', () => {
    const effets = appliquerEvenement([], {type: 'ajout-manuel', effet: effetRechargement('hero-1', 'Arbalète', 1)});
    expect(effetsDeLaFrise(effets, 'hero-1')).toEqual(['recharge : Arbalète · encore 2 rounds']);
  });
});

describe('effetsTombes et leur annonce', () => {
  const posture = effet({id: 'e-1'});
  const parade = effet({id: 'e-2', origine: 'parade', porteur: 'pnj-7'});
  const choc = effet({id: 'e-3', origine: 'renversement', porteur: 'pnj-7'});

  it('ne garde que ceux qui ont quitté l’état sans être retirés à la main', () => {
    expect(effetsTombes([posture, parade, choc], [choc], new Set(['e-2'])).map((e) => e.id)).toEqual(['e-1']);
    expect(effetsTombes([posture], [posture], new Set())).toEqual([]);
  });

  it('les annonce par leur libellé et le nom de leur porteur ; rien sans effet tombé', () => {
    const noms: Record<string, string> = {'hero-1': 'Axel', 'pnj-7': 'Bandit'};

    expect(annonceEffetsTombes([posture, parade], (carte) => noms[carte])).toBe(
      "Fin de l'effet posture défensive sur Axel. Fin de l'effet parade sur Bandit.",
    );
    expect(annonceEffetsTombes([], () => '')).toBeNull();
  });
});
