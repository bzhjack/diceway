import {BolSceneModel} from '../../models/bol-scene.model';
import {CombatCatalogEntry} from '../../models/combat-selection.model';
import {memesPersonnages, personnagesDe, personnagesVus, sceneChanges, sceneFormValue} from './scene-form.util';

const SCENE: BolSceneModel = {
  id: 's1',
  scenario_id: 'sc1',
  titre: 'Embuscade au gué',
  ordre: 0,
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
  image: '/assets/bol/gue.webp',
};

describe('sceneChanges', () => {
  it('rogne les textes, vide devient null, danger 0 devient null, et ne touche pas à l’illustration', () => {
    const changes = sceneChanges({
      titre: '  Le gué  ',
      region_id: 5,
      lieu: ' ',
      moment: 'crepuscule',
      meteo: null,
      danger: 0,
      lecture: '  Il pleut.  ',
      jeu: ' ',
      notes: '',
      pistes: [
        {texte: ' Suivre ', scene_id: 's3'},
        {texte: '  ', scene_id: null},
      ],
    });
    expect(changes).toEqual({
      titre: 'Le gué',
      region_id: 5,
      lieu: null,
      moment: 'crepuscule',
      meteo: null,
      danger: null,
      lecture: 'Il pleut.',
      jeu: null,
      notes: null,
      pistes: [{texte: 'Suivre', scene_id: 's3'}],
    });
    expect('image' in changes).toBe(false);
  });

  it('aucune piste devient null', () => {
    expect(sceneChanges({...sceneFormValue(SCENE), pistes: []}).pistes).toBeNull();
  });

  it('un aller-retour garde la préparation', () => {
    const prepared = {...SCENE, lieu: 'Gué du Tyr', danger: 3, jeu: 'Agilité Ardu (-1)', pistes: [{texte: 'Suivre', scene_id: null}]};
    expect(sceneChanges(sceneFormValue(prepared))).toEqual(
      expect.objectContaining({lieu: 'Gué du Tyr', danger: 3, jeu: 'Agilité Ardu (-1)', pistes: [{texte: 'Suivre', scene_id: null}]}),
    );
  });
});

describe('les personnages de la scène', () => {
  const scene: BolSceneModel = {
    ...SCENE,
    distribution: [
      {kind: 'pnj', source_id: 'p1', qty: 1, positions: [null]},
      {kind: 'creature', source_id: 'c1', qty: 3, camp: 'heros', attitude: 'amical', positions: [null, null, null]},
    ],
  };

  it('une scène ancienne, sans camp ni attitude, met ses personnages en adversaires sans attitude', () => {
    expect(personnagesDe(scene)).toEqual([
      {kind: 'pnj', source_id: 'p1', qty: 1, camp: 'adversaires', attitude: null},
      {kind: 'creature', source_id: 'c1', qty: 3, camp: 'heros', attitude: 'amical'},
    ]);
  });

  it('compare les personnages réglage par réglage', () => {
    const avant = personnagesDe(scene);

    expect(memesPersonnages(avant, personnagesDe(scene))).toBe(true);
    expect(memesPersonnages(avant, [avant[0], {...avant[1], qty: 2}])).toBe(false);
    expect(memesPersonnages(avant, [avant[1], avant[0]])).toBe(false);
  });

  it('montre le nom, le portrait et le type de chaque fiche ; une fiche absente est introuvable', () => {
    const catalogue = [{catalogId: 'creature:c1', kind: 'creature', sourceId: 'c1', nom: 'Loup géant', vitalite: 6, avatar: '/loup.webp', raw: {}}] as unknown as CombatCatalogEntry[];

    expect(personnagesVus(personnagesDe(scene), catalogue).map((p) => [p.nom, p.type, p.introuvable])).toEqual([
      ['Fiche introuvable', 'PNJ', true],
      ['Loup géant', 'Créature', false],
    ]);
    expect(personnagesVus(personnagesDe(scene), [], false).map((p) => [p.nom, p.introuvable])).toEqual([
      ['…', false],
      ['…', false],
    ]);
  });
});
