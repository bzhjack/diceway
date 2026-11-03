import {describe, expect, it} from 'vitest';
import {BolAccueilScenario, BolAccueilTable} from '../../models/bol-accueil.model';
import {accueilSagas, sagaResumes, situerScenario, tableOuverte, tableTitre, teinteDeSaga} from './accueil.util';
import {chapitre} from '../chapitre.testing';

const S: BolAccueilScenario[] = [
  chapitre('p2', "Perle du Beshaar — 2. De sable et d'eau"),
  chapitre('p1', 'Perle du Beshaar — 1. Sacrilège à Satarla'),
  chapitre('p10', 'Perle du Beshaar — 10. Épilogue'),
  chapitre('dv1', "Le Dieu voilé — 1. L'oracle de Nemmereth"),
  chapitre('dvi', 'Le Dieu voilé — Introduction : La colère de Nemmereth'),
  chapitre('clm', 'Chroniques lémuriennes — Mariage amer'),
  chapitre('clt', "Chroniques lémuriennes — La tour d'Ajhaskar"),
  chapitre('ps', 'premier scénario'),
  chapitre('lp', 'la perle du Beshaar'),
];

const saga = (nom: string | null, scenarios = S, joues: string[] = [], enCours: string | null = null) =>
  accueilSagas(scenarios, new Set(joues), enCours, null).find((s) => s.nom === nom)!;

const etats = (nom: string | null, joues: string[] = [], enCours: string | null = null) =>
  Object.fromEntries(saga(nom, S, joues, enCours).chapitres.map((c) => [c.id, c.etat]));

describe('accueilSagas', () => {
  it('groupe par saga, la saga récente d\'abord, Hors saga en dernier', () => {
    expect(accueilSagas(S, new Set(), null, 'dv1').map((s) => s.nom)).toEqual([
      'Le Dieu voilé',
      'Chroniques lémuriennes',
      'Perle du Beshaar',
      null,
    ]);
    expect(accueilSagas(S, new Set(), null, null).map((s) => s.nom)).toEqual([
      'Chroniques lémuriennes',
      'Le Dieu voilé',
      'Perle du Beshaar',
      null,
    ]);
  });

  it('ordonne les chapitres : introduction, numéros, puis alphabet', () => {
    const ids = (nom: string | null) => saga(nom).chapitres.map((c) => c.id);
    expect(ids('Perle du Beshaar')).toEqual(['p1', 'p2', 'p10']);
    expect(ids('Le Dieu voilé')).toEqual(['dvi', 'dv1']);
    expect(ids('Chroniques lémuriennes')).toEqual(['clt', 'clm']);
    expect(ids(null)).toEqual(['lp', 'ps']);
  });

  it('garde le titre complet et un libellé de chapitre', () => {
    const p2 = saga('Perle du Beshaar').chapitres.find((c) => c.id === 'p2')!;
    expect(p2.titre).toBe("Perle du Beshaar — 2. De sable et d'eau");
    expect(p2.libelle).toBe("2. De sable et d'eau");
    const ps = saga(null).chapitres.find((c) => c.id === 'ps')!;
    expect(ps.titre).toBe('premier scénario');
    expect(ps.libelle).toBe('premier scénario');
  });

  it('groupe sans tenir compte de la casse, avec le nom du premier titre vu', () => {
    const avecP3 = [...S, chapitre('p3', 'PERLE DU BESHAAR — 3. Le tombeau')];
    const perle = saga('Perle du Beshaar', avecP3);
    expect(perle.chapitres).toHaveLength(4);
    expect(accueilSagas(avecP3, new Set(), null, null).filter((s) => s.nom?.toLowerCase() === 'perle du beshaar')).toHaveLength(1);
  });

  it('coupe au premier tiret cadratin', () => {
    const sagas = accueilSagas(
      [
        chapitre('abc', 'A — B — C'),
        chapitre('x', '— X'),
        chapitre('sv', 'Saga — '),
      ],
      new Set(),
      null,
      null,
    );
    const a = sagas.find((s) => s.nom === 'A')!;
    expect(a.chapitres.map((c) => c.libelle)).toEqual(['B — C']);
    const horsSaga = sagas.find((s) => s.nom === null)!;
    expect(horsSaga.chapitres.map((c) => [c.id, c.libelle]).sort()).toEqual([
      ['sv', 'Saga — '],
      ['x', '— X'],
    ]);
    expect(sagas.map((s) => s.nom)).toEqual(['A', null]);
  });

  it('en cours, joué, à suivre', () => {
    expect(etats('Perle du Beshaar', ['p1'], 'p2')).toEqual({p1: 'joue', p2: 'en-cours', p10: 'prochain'});
  });

  it('sans table, le prochain suit le dernier joué', () => {
    expect(etats('Perle du Beshaar', ['p1', 'p2'], null)).toEqual({p1: 'joue', p2: 'joue', p10: 'prochain'});
  });

  it('un chapitre sauté ne devient pas prochain à rebours', () => {
    const e = etats('Perle du Beshaar', ['p1', 'p10'], null);
    expect(e).toEqual({p1: 'joue', p2: 'a-jouer', p10: 'joue'});
    expect(Object.values(e)).not.toContain('prochain');
  });

  it('en cours l\'emporte sur joué', () => {
    expect(etats('Perle du Beshaar', ['p2'], 'p2')['p2']).toBe('en-cours');
  });

  it('rien de joué, rien à suivre', () => {
    for (const nom of ['Perle du Beshaar', 'Le Dieu voilé', 'Chroniques lémuriennes', null]) {
      expect(Object.values(etats(nom)).every((e) => e === 'a-jouer')).toBe(true);
    }
  });

  it('pas de prochain en Hors saga', () => {
    expect(etats(null, ['lp'])).toEqual({lp: 'joue', ps: 'a-jouer'});
  });
});

describe('tableTitre', () => {
  const table = (extra: Partial<BolAccueilTable>): BolAccueilTable => ({
    id: 't1',
    titre: null,
    statut: 'libre',
    scenario_id: null,
    scene_id: null,
    scenes: [],
    scenes_jouees: [],
    created_at: '2026-11-02T12:00:00',
    ...extra,
  });

  it('prend le titre de la session s\'il existe', () => {
    expect(tableTitre(table({titre: 'Soirée', scenario_id: 'p2'}), S)).toBe('Soirée');
  });

  it('sinon le titre complet du scénario', () => {
    expect(tableTitre(table({scenario_id: 'p2'}), S)).toBe("Perle du Beshaar — 2. De sable et d'eau");
  });

  it('sinon la date de la table, quand le scénario est absent ou inconnu', () => {
    expect(tableTitre(table({}), S)).toBe('Table du 2 novembre');
    expect(tableTitre(table({scenario_id: 'zz'}), S)).toBe('Table du 2 novembre');
  });
});

describe('sagaResumes', () => {
  const resume = (nom: string | null, joues: string[] = [], enCours: string | null = null, scenarios = S) =>
    sagaResumes(accueilSagas(scenarios, new Set(joues), enCours, null), enCours === null ? null : 't1').find((r) => r.nom === nom)!;

  it('compte les chapitres joués et continue par le suivant, sur une nouvelle table', () => {
    const perle = resume('Perle du Beshaar', ['p1', 'p2']);

    expect(perle).toMatchObject({joues: 2, total: 3, resume: '2 chapitres joués sur 3'});
    expect(perle.suite).toEqual({
      id: 'p10',
      libelle: '10. Épilogue',
      action: 'Continuer',
      route: null,
      ariaLabel: 'Continuer 10. Épilogue, Perle du Beshaar, sur une nouvelle table',
    });
  });

  it('commence un scénario pas encore commencé par son premier chapitre', () => {
    expect(resume('Le Dieu voilé').suite).toMatchObject({id: 'dvi', action: 'Commencer'});
    expect(resume('Le Dieu voilé').resume).toBe('Pas encore commencé');
  });

  it('dit « Reste à jouer », pas « Continuer », pour un chapitre sauté avant le dernier joué', () => {
    // Joués : le 2 et l'épilogue ; rien après l'épilogue, le 1 reste à jouer.
    const perle = resume('Perle du Beshaar', ['p2', 'p10']);

    expect(perle.suite).toMatchObject({id: 'p1', action: 'Reste à jouer'});
    expect(perle.resume).toBe('2 chapitres joués sur 3');
  });

  it('reprend la table ouverte sur son chapitre, au lieu d’en ouvrir une autre plus loin dans la saga', () => {
    // La table porte le 1 alors que le 2 est joué : la carte dit la même chose que le bandeau, pas « Continuer : Épilogue ».
    const perle = resume('Perle du Beshaar', ['p1', 'p2'], 'p1');

    expect(perle.suite).toEqual({
      id: 'p1',
      libelle: '1. Sacrilège à Satarla',
      action: 'Reprendre',
      route: ['/session', 't1', 'play'],
      ariaLabel: 'Reprendre 1. Sacrilège à Satarla, Perle du Beshaar, sur la table ouverte',
    });
    // Le compteur reste dit en toutes lettres : les pastilles seules ne s'expliquent pas.
    expect(perle.resume).toBe('Table ouverte · 1 chapitre joué sur 3');
  });

  it('dit un scénario achevé quand tout est joué', () => {
    const achevee = resume('Chroniques lémuriennes', ['clm', 'clt']);
    expect(achevee.suite).toBeNull();
    expect(achevee.resume).toBe('Scénario achevé');
  });

  it('parle de scénarios, sans ordre ni saga, hors saga', () => {
    const un: BolAccueilScenario[] = [chapitre('ps', 'premier scénario')];
    const deux: BolAccueilScenario[] = [...un, chapitre('ps2', 'second scénario')];

    expect(resume(null, [], null, un)).toMatchObject({resume: '1 scénario à jouer', avancement: '0 scénario joué sur 1', suite: {id: 'ps', action: 'Jouer'}});
    expect(resume(null, [], null, deux).resume).toBe('2 scénarios à jouer');
    expect(resume(null, ['ps'], null, deux)).toMatchObject({resume: '1 scénario joué sur 2', suite: {id: 'ps2', action: 'Jouer'}});
    expect(resume(null, ['ps'], null, un).resume).toBe('Tout est joué');
    expect(resume(null, [], 'ps', un).suite).toMatchObject({action: 'Reprendre', route: ['/session', 't1', 'play']});
  });

  it('donne à chaque saga une teinte stable, dans l’ordre alphabétique, et aucune hors saga', () => {
    const teintes = (recent: string | null) =>
      Object.fromEntries(sagaResumes(accueilSagas(S, new Set(), null, recent), null).map((r) => [r.nom ?? 'hors', r.teinte]));

    expect(teintes(null)).toEqual({'Chroniques lémuriennes': 1, 'Le Dieu voilé': 2, 'Perle du Beshaar': 3, hors: 0});
    expect(teintes('dv1')).toEqual(teintes(null));
  });

  it('met chaque chapitre en pastille : son numéro, « Intro », sinon son initiale', () => {
    expect(resume('Perle du Beshaar', ['p2'], 'p1').reperes).toEqual([
      {marque: '1', etat: 'en-cours', texte: '1. Sacrilège à Satarla : sur la table'},
      {marque: '2', etat: 'joue', texte: "2. De sable et d'eau : joué"},
      {marque: '10', etat: 'prochain', texte: '10. Épilogue : à jouer'},
    ]);
    expect(resume('Le Dieu voilé').reperes.map((r) => r.marque)).toEqual(['Intro', '1']);
    expect(resume('Chroniques lémuriennes').reperes.map((r) => r.marque)).toEqual(['L', 'M']);
  });
});

describe('situerScenario', () => {
  const situer = (id: string) => situerScenario(S.find((s) => s.id === id)!, S);

  it('place un chapitre dans sa saga, d’après son numéro', () => {
    expect(situer('p2')).toEqual({
      saga: 'Perle du Beshaar',
      histoire: 'Perle du Beshaar',
      chapitre: 'Chapitre 2 sur 3',
      chapitreCourt: 'Chapitre 2',
      nom: "De sable et d'eau",
    });
  });

  it('nomme l’introduction, garde le libellé d’un chapitre sans numéro, et dit « One shot » hors saga', () => {
    expect(situer('dvi')).toMatchObject({chapitre: 'Introduction', nom: 'La colère de Nemmereth'});
    expect(situer('clm')).toMatchObject({chapitre: null, nom: 'Mariage amer'});
    expect(situer('ps')).toEqual({saga: null, histoire: 'One shot', chapitre: null, chapitreCourt: null, nom: 'premier scénario'});
  });
});

describe('tableOuverte', () => {
  const SCENES = [
    chapitre('s1', 'La taverne'),
    chapitre('s2', 'Le trajet'),
    chapitre('s3', 'Le temple'),
    chapitre('s4', 'La nuit'),
  ];
  const table = (over: Partial<BolAccueilTable> = {}): BolAccueilTable => ({
    id: 't',
    titre: null,
    statut: 'libre',
    scenario_id: 'p1',
    scene_id: null,
    scenes: [],
    scenes_jouees: [],
    created_at: '2026-11-02T10:00:00Z',
    ...over,
  });

  it('dit où en est l’histoire : la saga, le chapitre sur ceux de la saga, la scène, et le nom du chapitre en titre', () => {
    const ouverte = tableOuverte(table({statut: 'combat', scenes: SCENES, scene_id: 's4', scenes_jouees: ['s1', 's2', 's4']}), S);

    expect(ouverte).toEqual({
      id: 't',
      saga: 'Perle du Beshaar',
      histoire: 'Perle du Beshaar',
      chapitre: 'Chapitre 1 sur 3',
      scene: 'Scène 4 sur 4',
      titre: 'Sacrilège à Satarla',
      sceneEnCours: 'La nuit',
      enCombat: true,
      scenes: [
        {etat: 'jouee', texte: 'Scène 1, La taverne : jouée'},
        {etat: 'jouee', texte: 'Scène 2, Le trajet : jouée'},
        {etat: 'a-jouer', texte: 'Scène 3, Le temple : à jouer'},
        {etat: 'en-cours', texte: 'Scène 4, La nuit : en cours'},
      ],
      scenesJouees: '2 scènes jouées sur 4',
      filAriane: 'Perle du Beshaar › Chapitre 1 › Scène 4 · La nuit',
    });
  });

  it('nomme l’introduction, et garde le libellé d’un chapitre sans numéro', () => {
    expect(tableOuverte(table({scenario_id: 'dvi'}), S)).toMatchObject({
      chapitre: 'Introduction',
      titre: 'La colère de Nemmereth',
      scene: null,
      scenesJouees: null,
      filAriane: 'Le Dieu voilé › Introduction',
    });
    expect(tableOuverte(table({scenario_id: 'clm'}), S)).toMatchObject({chapitre: null, titre: 'Mariage amer', filAriane: 'Chroniques lémuriennes › Mariage amer'});
  });

  it('garde le titre donné à la table', () => {
    expect(tableOuverte(table({titre: 'Soirée chez Lionel'}), S)).toMatchObject({chapitre: 'Chapitre 1 sur 3', titre: 'Soirée chez Lionel'});
  });

  it('dit « One shot » hors saga, « Sans scénario » quand on improvise', () => {
    expect(tableOuverte(table({scenario_id: 'ps'}), S)).toMatchObject({saga: null, histoire: 'One shot', chapitre: null, titre: 'premier scénario'});
    expect(tableOuverte(table({scenario_id: null}), S)).toMatchObject({
      saga: null,
      histoire: 'Sans scénario',
      titre: 'Table du 2 novembre',
      filAriane: 'Sans scénario › Table du 2 novembre',
    });
  });

  it('ne situe pas une scène qui n’est pas de ce chapitre', () => {
    expect(tableOuverte(table({scenes: SCENES, scene_id: 'ailleurs'}), S)).toMatchObject({scene: null, sceneEnCours: null});
  });
});

describe('teinteDeSaga', () => {
  // Un chapitre dont la saga est écrite dans une autre casse : il rejoint « Perle du Beshaar » (le premier titre vu donne le nom).
  const AVEC_CASSE: BolAccueilScenario[] = [...S, chapitre('pc', 'PERLE DU BESHAAR — 3. La casse')];
  const resumes = sagaResumes(accueilSagas(AVEC_CASSE, new Set(), null, null), null);
  const table: BolAccueilTable = {
    id: 't',
    titre: null,
    statut: 'libre',
    scenario_id: 'pc',
    scene_id: null,
    scenes: [],
    scenes_jouees: [],
    created_at: '2026-11-02T10:00:00Z',
  };

  it('garde la teinte de la saga de la table ouverte quand la casse de son nom diffère', () => {
    const saga = tableOuverte(table, AVEC_CASSE).saga;

    expect(saga).toBe('PERLE DU BESHAAR');
    expect(teinteDeSaga(resumes, saga)).toBe(3);
    expect(teinteDeSaga(resumes, 'perle du beshaar')).toBe(3);
  });

  it('donne la teinte d’une saga de même nom exact', () => {
    expect(teinteDeSaga(resumes, 'Le Dieu voilé')).toBe(2);
  });

  it('ne donne aucune teinte sans saga, ou pour une saga inconnue', () => {
    expect(teinteDeSaga(resumes, null)).toBe(0);
    expect(teinteDeSaga(resumes, 'Saga inconnue')).toBe(0);
  });
});
