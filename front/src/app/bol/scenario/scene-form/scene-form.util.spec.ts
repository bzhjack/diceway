import {BolSceneModel} from '../../models/bol-scene.model';
import {CombatCatalogEntry} from '../../models/combat-selection.model';
import {ambianceEnPhrase, aUnPortrait, avecLaFiche, avecLeReglage, compteDesCamps, dureeDeLecture, memesPersonnages, personnagesDe, personnagesVus, sceneChanges, sceneFormValue} from './scene-form.util';

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
      {kind: 'pnj', source_id: 'p1', qty: 1},
      {kind: 'creature', source_id: 'c1', qty: 3, camp: 'heros', attitude: 'amical'},
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

describe('avecLaFiche et avecLeReglage', () => {
  const loup = {catalogId: 'creature:c1', kind: 'creature', sourceId: 'c1', nom: 'Loup'} as unknown as CombatCatalogEntry;
  const drajit = {catalogId: 'pnj:p1', kind: 'pnj', sourceId: 'p1', nom: 'Drajit'} as unknown as CombatCatalogEntry;

  it('fait entrer une fiche en adversaire ; une fiche déjà là, PNJ compris, gagne un exemplaire', () => {
    const une = avecLaFiche([], loup);
    expect(une).toEqual([{kind: 'creature', source_id: 'c1', qty: 1, camp: 'adversaires', attitude: null}]);
    expect(avecLaFiche(une, loup)[0].qty).toBe(2);
    const avecDrajit = avecLaFiche(une, drajit);
    expect(avecLaFiche(avecDrajit, drajit)[1]).toMatchObject({kind: 'pnj', source_id: 'p1', qty: 2});
  });

  it('une scène pleine ne prend plus de fiche nouvelle', () => {
    const pleine = Array.from({length: 60}, (_, i) => ({kind: 'demon' as const, source_id: `d${i}`, qty: 1, camp: 'adversaires' as const, attitude: null}));
    expect(avecLaFiche(pleine, loup)).toHaveLength(60);
  });

  it('garde un nombre entre 1 et 30, pour un PNJ aussi', () => {
    const liste = [
      {kind: 'creature' as const, source_id: 'c1', qty: 29, camp: 'adversaires' as const, attitude: null},
      {kind: 'pnj' as const, source_id: 'p1', qty: 1, camp: 'adversaires' as const, attitude: null},
    ];
    expect(avecLeReglage(liste, 0, {qty: 40})[0].qty).toBe(30);
    expect(avecLeReglage(liste, 0, {qty: 0})[0].qty).toBe(1);
    expect(avecLeReglage(liste, 1, {qty: 3, camp: 'heros'})[1]).toMatchObject({qty: 3, camp: 'heros'});
  });
});

describe('ce que montrent l’affiche et la distribution', () => {
  it('compte les personnages de chaque camp, exemplaires compris', () => {
    expect(
      compteDesCamps([
        {kind: 'creature', source_id: 'c1', qty: 5, camp: 'adversaires', attitude: null},
        {kind: 'pnj', source_id: 'p1', qty: 1, camp: 'heros', attitude: null},
      ]),
    ).toEqual({adversaires: 5, allies: 1});
  });

  it('dit le temps de lire un texte à voix haute, à la minute près', () => {
    expect(dureeDeLecture('  ')).toBeNull();
    expect(dureeDeLecture('Quinze jours de galère.')).toBe('1 min');
    expect(dureeDeLecture(Array.from({length: 400}, () => 'mot').join(' '))).toBe('3 min');
  });

  it('dit l’ambiance en une phrase', () => {
    expect(ambianceEnPhrase({lieu: ' Jalad Nût ', moment: 'nuit', danger: 4})).toBe('Jalad Nût, de nuit, danger 4');
    expect(ambianceEnPhrase({lieu: '', moment: 'aube', danger: 0})).toBe("à l'aube");
    expect(ambianceEnPhrase({lieu: '', moment: null, danger: 0})).toBe('');
  });

  it('ne prend pas l’avatar vide pour un portrait', () => {
    expect(aUnPortrait('/loup.webp')).toBe(true);
    expect(aUnPortrait('/assets/bol/empty-avatar.jpg')).toBe(false);
    expect(aUnPortrait('')).toBe(false);
  });
});
