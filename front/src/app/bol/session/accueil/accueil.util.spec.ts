import {describe, expect, it} from 'vitest';
import {BolAccueilScenario, BolAccueilTable} from '../../models/bol-accueil.model';
import {accueilSagas, sagaResumes, tableOuverte, tableTitre, teinteDeSaga} from './accueil.util';

const S: BolAccueilScenario[] = [
  {id: 'p2', titre: "Perle du Beshaar — 2. De sable et d'eau"},
  {id: 'p1', titre: 'Perle du Beshaar — 1. Sacrilège à Satarla'},
  {id: 'p10', titre: 'Perle du Beshaar — 10. Épilogue'},
  {id: 'dv1', titre: "Le Dieu voilé — 1. L'oracle de Nemmereth"},
  {id: 'dvi', titre: 'Le Dieu voilé — Introduction : La colère de Nemmereth'},
  {id: 'clm', titre: 'Chroniques lémuriennes — Mariage amer'},
  {id: 'clt', titre: "Chroniques lémuriennes — La tour d'Ajhaskar"},
  {id: 'ps', titre: 'premier scénario'},
  {id: 'lp', titre: 'la perle du Beshaar'},
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
    const avecP3 = [...S, {id: 'p3', titre: 'PERLE DU BESHAAR — 3. Le tombeau'}];
    const perle = saga('Perle du Beshaar', avecP3);
    expect(perle.chapitres).toHaveLength(4);
    expect(accueilSagas(avecP3, new Set(), null, null).filter((s) => s.nom?.toLowerCase() === 'perle du beshaar')).toHaveLength(1);
  });

  it('coupe au premier tiret cadratin', () => {
    const sagas = accueilSagas(
      [
        {id: 'abc', titre: 'A — B — C'},
        {id: 'x', titre: '— X'},
        {id: 'sv', titre: 'Saga — '},
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
  const resume = (nom: string | null, joues: string[] = [], enCours: string | null = null) =>
    sagaResumes(accueilSagas(S, new Set(joues), enCours, null)).find((r) => r.nom === nom)!;

  it('compte les chapitres joués et propose le prochain', () => {
    const perle = resume('Perle du Beshaar', ['p1', 'p2']);

    expect(perle).toMatchObject({joues: 2, total: 3, resume: '2 chapitres joués sur 3'});
    expect(perle.suite?.id).toBe('p10');
  });

  it('propose le premier chapitre à jouer quand aucun n’est le prochain', () => {
    expect(resume('Le Dieu voilé').suite?.id).toBe('dvi');
    expect(resume('Le Dieu voilé').resume).toBe('Pas encore commencée');
  });

  it('commence une saga pas encore commencée ; continue une saga entamée ou sur la table', () => {
    expect(resume('Le Dieu voilé').action).toBe('Commencer');
    expect(resume('Perle du Beshaar', ['p1']).action).toBe('Continuer');
    expect(resume('Perle du Beshaar', [], 'p1').action).toBe('Continuer');
  });

  it('dit la saga sur la table, et achevée quand tout est joué', () => {
    // Le compteur reste dit en toutes lettres quand la saga est sur la table : l'anneau seul ne s'explique pas.
    expect(resume('Perle du Beshaar', ['p2'], 'p1').resume).toBe('Sur la table ce soir · 1 chapitre joué sur 3');
    const achevee = resume('Chroniques lémuriennes', ['clm', 'clt']);
    expect(achevee.suite).toBeNull();
    expect(achevee.resume).toBe('Saga achevée');
  });

  it('donne à chaque saga une teinte stable, dans l’ordre alphabétique, et aucune hors saga', () => {
    const teintes = (recent: string | null) =>
      Object.fromEntries(sagaResumes(accueilSagas(S, new Set(), null, recent)).map((r) => [r.nom ?? 'hors', r.teinte]));

    expect(teintes(null)).toEqual({'Chroniques lémuriennes': 1, 'Le Dieu voilé': 2, 'Perle du Beshaar': 3, hors: 0});
    expect(teintes('dv1')).toEqual(teintes(null));
  });

  it('remplit l’anneau à la mesure de l’avancement', () => {
    const [plein, circonference] = resume('Perle du Beshaar', ['p1', 'p2', 'p10']).anneau.split(' ').map(Number);
    expect(plein).toBeCloseTo(circonference, 0);
    expect(Number(resume('Le Dieu voilé').anneau.split(' ')[0])).toBe(0);
  });
});

describe('tableOuverte', () => {
  const table = (over: Partial<BolAccueilTable> = {}): BolAccueilTable => ({id: 't', titre: null, statut: 'libre', scenario_id: 'p1', created_at: '2026-11-02T10:00:00Z', ...over});

  it('met la saga au-dessus et le chapitre en titre', () => {
    expect(tableOuverte(table(), S)).toEqual({id: 't', saga: 'Perle du Beshaar', titre: '1. Sacrilège à Satarla'});
  });

  it('garde le titre donné à la table', () => {
    expect(tableOuverte(table({titre: 'Soirée chez Lionel'}), S)).toEqual({id: 't', saga: 'Perle du Beshaar', titre: 'Soirée chez Lionel'});
  });

  it('sans scénario, tombe sur la date', () => {
    expect(tableOuverte(table({scenario_id: null}), S)).toEqual({id: 't', saga: null, titre: 'Table du 2 novembre'});
  });
});

describe('teinteDeSaga', () => {
  // Un chapitre dont la saga est écrite dans une autre casse : il rejoint « Perle du Beshaar » (le premier titre vu donne le nom).
  const AVEC_CASSE: BolAccueilScenario[] = [...S, {id: 'pc', titre: 'PERLE DU BESHAAR — 3. La casse'}];
  const resumes = sagaResumes(accueilSagas(AVEC_CASSE, new Set(), null, null));
  const table: BolAccueilTable = {id: 't', titre: null, statut: 'libre', scenario_id: 'pc', created_at: '2026-11-02T10:00:00Z'};

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
