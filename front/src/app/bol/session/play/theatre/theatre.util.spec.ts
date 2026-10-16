import {CombatCamp} from '../../../models/bol-fight-session.model';
import {BolSceneModel} from '../../../models/bol-scene.model';
import {CombatCatalogEntry} from '../../../models/combat-selection.model';
import {TapisCard, TapisKind} from '../../models/tapis.model';
import {acteLabel, ATTITUDES, compagnie, distributionPortraits, lieuTexte, sceneActs, sceneDecor, troupe} from './theatre.util';

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
  const coords = {5: {x: 26.4, y: 59}};

  it("préfère l'illustration", () => {
    expect(sceneDecor(scene('s', 0, {image: '/assets/bol/quest.jpg', region_id: 5}), coords)).toEqual({kind: 'image', url: '/assets/bol/quest.jpg'});
  });

  it('retombe sur la carte de la région, même avec une adresse vide', () => {
    expect(sceneDecor(scene('s', 0, {image: '  ', region_id: 5}), coords)).toEqual({kind: 'carte', x: 26.4, y: 59});
  });

  it('sans région connue ni illustration, rien', () => {
    expect(sceneDecor(scene('s', 0, {region_id: 99}), coords)).toEqual({kind: 'aucun'});
    expect(sceneDecor(null, coords)).toEqual({kind: 'aucun'});
  });
});

describe('distributionPortraits', () => {
  it('retrouve nom et portrait dans le catalogue et garde la quantité', () => {
    const catalog = [{catalogId: 'creature-24', kind: 'creature', sourceId: '24', nom: 'Kroark', vitalite: 14, avatar: '/k.jpg'}] as unknown as CombatCatalogEntry[];
    expect(
      distributionPortraits(
        [
          {kind: 'creature', source_id: '24', qty: 3, positions: []},
          {kind: 'pnj', source_id: '404', qty: 1, positions: []},
        ],
        catalog,
      ),
    ).toEqual([{nom: 'Kroark', avatar: '/k.jpg', qty: 3}]);
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
