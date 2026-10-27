import {CombatCamp} from '../../../models/bol-fight-session.model';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {acteLabel, ATTITUDES, cartonTenue, compagnie, lieuTexte, parFiche, campsComptes, sceneActs, sceneDecor, troupe} from './theatre.util';

function scene(id: string, ordre: number, extra: Partial<BolSceneModel> = {}): BolSceneModel {
  return {
    id,
    scenario_id: 'sc1',
    titre: `Scène ${id}`,
    ordre,
    notes: null,
    distribution: [],
    region_id: null,
    lieu: null,
    moment: null,
    meteo: null,
    danger: null,
    lecture: null,
    jeu: null,
    pistes: null,
    image: null,
    ...extra,
  };
}

const KNOWN = new Set(['sc1']);

describe('sceneActs', () => {
  it('numérote les scènes du scénario et donne leur statut', () => {
    const acts = sceneActs([scene('s3', 2), scene('s1', 0), scene('s2', 1)], 'sc1', KNOWN, 's2', ['s1', 's2']);
    expect(acts.map((a) => [a.scene.id, a.numero, a.statut])).toEqual([
      ['s1', 1, 'jouee'],
      ['s2', 2, 'en-cours'],
      ['s3', 3, 'a-venir'],
    ]);
  });

  it('sans scène courante ni scénario, montre les scènes sans scénario', () => {
    const acts = sceneActs([scene('s1', 0), scene('libre', 0, {scenario_id: null})], null, KNOWN, null, []);
    expect(acts.map((a) => [a.scene.id, a.statut])).toEqual([['libre', 'a-venir']]);
  });
});

describe('sceneDecor', () => {
  it("préfère l'illustration", () => {
    expect(sceneDecor(scene('s', 0, {image: '/assets/bol/quest.jpg', region_id: 5}))).toBe('/assets/bol/quest.jpg');
  });

  it("sans illustration, l'image par défaut de la maquette, quelle que soit la région", () => {
    const parDefaut = '/assets/bol/dashboard-header.png';
    expect(sceneDecor(scene('s', 0, {image: '  ', region_id: 5}))).toBe(parDefaut);
    expect(sceneDecor(scene('s', 0))).toBe(parDefaut);
    expect(sceneDecor(null)).toBe(parDefaut);
  });
});

describe('lieuTexte', () => {
  it('donne le lieu puis la région', () => {
    expect(lieuTexte('Gué du Tyr', 'Jungle de Qush')).toBe('Gué du Tyr, Jungle de Qush');
  });

  it("se contente de ce qu'il a", () => {
    expect(lieuTexte(null, 'Jungle de Qush')).toBe('Jungle de Qush');
    expect(lieuTexte('  Gué du Tyr ', null)).toBe('Gué du Tyr');
    expect(lieuTexte(' ', null)).toBeNull();
  });
});

describe('cartonTenue', () => {
  it('ne tient que le titre, et une durée fixe avec moins d’animations', () => {
    expect(cartonTenue(false)).toBe(1300);
    expect(cartonTenue(true)).toBe(1400);
  });
});

describe('acteLabel', () => {
  it('dit le numéro, le titre et le statut', () => {
    expect(acteLabel({scene: scene('s2', 1), numero: 2, statut: 'en-cours'})).toBe('Scène 2, Scène s2, en cours');
    expect(acteLabel({scene: scene('s1', 0), numero: 1, statut: 'jouee'})).toBe('Scène 1, Scène s1, jouée');
    expect(acteLabel({scene: scene('s3', 2), numero: 3, statut: 'a-venir'})).toBe('Scène 3, Scène s3');
  });
});

function card(key: string, rang: string | null, camp: CombatCamp = 'adversaires'): TapisCard {
  const [kind, id] = key.split('-');
  return {
    key,
    kind: kind as TapisKind,
    camp,
    pivotId: Number(id),
    sourceId: 'src',
    nom: key,
    avatar: '',
    badge: null,
    rang,
    degats: 'd6',
    defense: '0',
    vitaliteCourante: 5,
    vitaliteMax: 5,
    joueur: null,
    heroisme: null,
    attitude: null,
    vilenie: null,
  };
}

function heroCard(key: string): TapisCard {
  return {...card(key, null, 'heros'), joueur: 'Clara', heroisme: 3};
}

describe('troupe', () => {
  it('troupe : seulement les présents, rival puis coriace puis piétaille', () => {
    const cards = [card('creature-3', 'Piétaille'), card('pnj-1', 'Coriace'), card('pnj-2', 'Rival'), card('creature-4', 'Piétaille', 'heros')];
    expect(troupe(cards).map((t) => [t.card.key, t.taille])).toEqual([
      ['pnj-2', 'rival'],
      ['pnj-1', 'coriace'],
      ['creature-3', 'pietaille'],
    ]);
  });
});

describe('compagnie', () => {
  it('compagnie : les héros, puis les alliés', () => {
    const cards = [card('pnj-2', 'Rival', 'heros'), heroCard('hero-1'), card('pnj-1', 'Coriace')];
    expect(compagnie(cards)).toEqual({heros: [cards[1]], allies: [cards[0]]});
  });

  it("range les héros et les alliés par ordre d'arrivée", () => {
    const cards = [heroCard('hero-2'), card('pnj-9', 'Rival', 'heros'), heroCard('hero-1'), card('creature-3', 'Piétaille', 'heros')];
    const groupes = compagnie(cards);
    expect(groupes.heros.map((c) => c.key)).toEqual(['hero-1', 'hero-2']);
    expect(groupes.allies.map((c) => c.key)).toEqual(['pnj-9', 'creature-3']);
  });
});

describe('ATTITUDES', () => {
  it('va de l’hostile à l’amical', () => {
    expect(ATTITUDES.map((a) => a.label)).toEqual(['Hostile', 'Méfiant', 'Neutre', 'Amical']);
  });
});

describe('campsComptes', () => {
  const entry = (qty: number, camp?: 'heros' | 'adversaires') => ({kind: 'pnj' as const, source_id: 'x', qty, camp, positions: []});
  const textes = (comptes: ReturnType<typeof campsComptes>) => comptes.map((c) => `${c.allie ? 'A' : 'E'} ${c.texte}`);

  it('compte alliés puis adversaires, quantités comprises (sans camp = adversaire)', () => {
    expect(textes(campsComptes([entry(6), entry(4, 'adversaires'), entry(2), entry(3, 'heros'), entry(2, 'heros')]))).toEqual(['A 5 alliés', 'E 12 adversaires']);
    expect(textes(campsComptes([entry(1), entry(1, 'heros')]))).toEqual(['A 1 allié', 'E 1 adversaire']);
  });

  it('tait un camp vide, et ne dit rien sans distribution', () => {
    expect(textes(campsComptes([entry(2)]))).toEqual(['E 2 adversaires']);
    expect(textes(campsComptes([entry(1, 'heros')]))).toEqual(['A 1 allié']);
    expect(campsComptes([])).toEqual([]);
  });
});

describe('parFiche', () => {
  const card = (key: string, kind: string, sourceId: string | null) => ({key, kind, sourceId}) as unknown as TapisCard;

  it('regroupe les exemplaires d’une même fiche, à la place du premier, et laisse seule une carte sans fiche', () => {
    const groupes = parFiche([
      card('pnj-1', 'pnj', '10'),
      card('pnj-2', 'pnj', '12'),
      card('creature-3', 'creature', '12'),
      card('pnj-4', 'pnj', '12'),
      card('pnj-5', 'pnj', null),
      card('pnj-6', 'pnj', null),
    ]);
    expect(groupes.map((g) => g.map((c) => c.key))).toEqual([['pnj-1'], ['pnj-2', 'pnj-4'], ['creature-3'], ['pnj-5'], ['pnj-6']]);
  });
});
