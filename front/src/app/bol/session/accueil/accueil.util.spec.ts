import {describe, expect, it} from 'vitest';
import {BolAccueilModel, BolAccueilPartie, BolAccueilScenario} from '../../models/bol-accueil.model';
import {bandeauDePartie, chapitresDuScenario, partiesDeLAccueil, scenariosDuCompte, scenariosLibresPour, situerScenario, teinteDeScenario} from './accueil.util';
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

const partie = (over: Partial<BolAccueilPartie> = {}): BolAccueilPartie => ({
  id: 't',
  compagnie_id: 'c1',
  titre: 'Les Lames de Satarla',
  statut: 'libre',
  jouee_le: '2026-11-04T10:00:00+00:00',
  scenario_id: 'p2',
  scene_id: null,
  scenes: [],
  scenes_jouees: [],
  chapitres_joues: [],
  scenario_termine: false,
  heros: [],
  figurants: 0,
  ...over,
});

const accueil = (parties: BolAccueilPartie[], derniere = parties[0]?.id ?? null): BolAccueilModel => ({
  derniere,
  parties,
  compagnies: [],
  scenarios: S,
  comptes: {heros: 0, pnjs: 0, creatures: 0, demons: 0, armes: 0, armures: 0, sessions: parties.length, compagnies: 0},
});

const carte = (over: Partial<BolAccueilPartie> = {}) => partiesDeLAccueil(accueil([partie(over)]))[0];

describe('chapitresDuScenario', () => {
  it('donne les chapitres de la saga d’un chapitre : introduction, numéros, puis alphabet', () => {
    expect(chapitresDuScenario('p2', S).map((c) => c.id)).toEqual(['p1', 'p2', 'p10']);
    expect(chapitresDuScenario('dv1', S).map((c) => c.id)).toEqual(['dvi', 'dv1']);
    expect(chapitresDuScenario('clm', S).map((c) => c.id)).toEqual(['clt', 'clm']);
  });

  it('un one shot est son propre scénario ; sans chapitre, rien', () => {
    expect(chapitresDuScenario('ps', S).map((c) => c.id)).toEqual(['ps']);
    expect(chapitresDuScenario(null, S)).toEqual([]);
    expect(chapitresDuScenario('inconnu', S)).toEqual([]);
  });
});

describe('scenariosDuCompte', () => {
  it('liste les sagas par ordre alphabétique, puis les one shots, chacun avec ses chapitres et sa teinte', () => {
    const choix = scenariosDuCompte(S);

    expect(choix.map((c) => c.nom)).toEqual([
      'Chroniques lémuriennes',
      'Le Dieu voilé',
      'Perle du Beshaar',
      'la perle du Beshaar',
      'premier scénario',
    ]);
    expect(choix[1]).toEqual({
      id: 'saga:le dieu voilé',
      nom: 'Le Dieu voilé',
      oneShot: false,
      teinte: 2,
      chapitres: [
        {id: 'dvi', libelle: 'Introduction : La colère de Nemmereth'},
        {id: 'dv1', libelle: "1. L'oracle de Nemmereth"},
      ],
    });
    expect(choix[4]).toEqual({id: 'ps', nom: 'premier scénario', oneShot: true, teinte: 0, chapitres: [{id: 'ps', libelle: 'premier scénario'}]});
  });
});

describe('scenariosLibresPour', () => {
  const noms = (partieId: string, parties: BolAccueilPartie[]) => scenariosLibresPour(partieId, accueil(parties)).map((c) => c.nom);
  const improvisee = partie({id: 'imp', compagnie_id: 'c1', scenario_id: null});

  it('ne propose pas un scénario que sa compagnie joue déjà, quel que soit le chapitre où elle en est', () => {
    expect(noms('imp', [improvisee, partie({id: 'a', compagnie_id: 'c1', scenario_id: 'p2'})])).not.toContain('Perle du Beshaar');
  });

  it('ne propose pas un one shot que sa compagnie joue déjà', () => {
    expect(noms('imp', [improvisee, partie({id: 'a', compagnie_id: 'c1', scenario_id: 'ps'})])).not.toContain('premier scénario');
  });

  it('propose ce que joue une autre compagnie', () => {
    expect(noms('imp', [improvisee, partie({id: 'a', compagnie_id: 'c2', scenario_id: 'p2'})])).toContain('Perle du Beshaar');
  });

  it('une autre partie improvisée de la compagnie n’enlève rien', () => {
    const tous = noms('imp', [improvisee]);

    expect(noms('imp', [improvisee, partie({id: 'b', compagnie_id: 'c1', scenario_id: null})])).toEqual(tous);
    expect(tous).toHaveLength(5);
  });

  it('une partie sans compagnie garde tous les scénarios', () => {
    const sans = partie({id: 'imp', compagnie_id: null, scenario_id: null});

    expect(noms('imp', [sans, partie({id: 'a', compagnie_id: null, scenario_id: 'p2'})])).toHaveLength(5);
  });
});

describe('teinteDeScenario', () => {
  it('donne à chaque saga une teinte stable, dans l’ordre alphabétique, et aucune hors saga', () => {
    expect(teinteDeScenario('clm', S)).toBe(1);
    expect(teinteDeScenario('dv1', S)).toBe(2);
    expect(teinteDeScenario('p10', S)).toBe(3);
    expect(teinteDeScenario('ps', S)).toBe(0);
    expect(teinteDeScenario(null, S)).toBe(0);
  });
});

describe('partiesDeLAccueil', () => {
  it('nomme la partie par sa compagnie, « Table sans nom » sinon', () => {
    expect(carte().nom).toBe('Les Lames de Satarla');
    expect(carte({titre: null}).nom).toBe('Table sans nom');
    expect(carte({titre: '  '}).nom).toBe('Table sans nom');
  });

  it('place le scénario : la saga, le nom d’un one shot, ou « Partie improvisée »', () => {
    expect(carte().scenario).toBe('Perle du Beshaar');
    expect(carte({scenario_id: 'ps'}).scenario).toBe('premier scénario');
    expect(carte({scenario_id: null}).scenario).toBe('Partie improvisée');
    expect(carte({scenario_id: 'supprime'}).scenario).toBe('Partie improvisée');
  });

  it('marque les chapitres de la saga pour cette partie : joué, en cours, à jouer', () => {
    expect(carte({scenario_id: 'p2', chapitres_joues: ['p1']}).reperes).toEqual([
      {marque: '1', libelle: '1. Sacrilège à Satarla', etat: 'joue', texte: '1. Sacrilège à Satarla : joué'},
      {marque: '2', libelle: "2. De sable et d'eau", etat: 'en-cours', texte: "2. De sable et d'eau : en cours"},
      {marque: '10', libelle: '10. Épilogue', etat: 'a-jouer', texte: '10. Épilogue : à jouer'},
    ]);
    expect(carte({scenario_id: 'dv1'}).reperes.map((r) => r.marque)).toEqual(['Intro', '1']);
    expect(carte({scenario_id: 'clm'}).reperes.map((r) => r.marque)).toEqual(['L', 'M']);
  });

  it('ne met pas de pastilles pour un one shot ni pour une partie improvisée', () => {
    expect(carte({scenario_id: 'ps'}).reperes).toEqual([]);
    expect(carte({scenario_id: null}).reperes).toEqual([]);
  });

  it('« Reprendre » nomme le chapitre en cours ; rien pour une partie improvisée', () => {
    expect(carte().reprendre).toBe("2. De sable et d'eau");
    expect(carte({scenario_id: 'ps'}).reprendre).toBe('premier scénario');
    expect(carte({scenario_id: null}).reprendre).toBeNull();
  });

  it('le scénario n’est terminé que si le MJ l’a dit, même avec tous ses chapitres joués', () => {
    expect(carte({scenario_id: 'p10', chapitres_joues: ['p1', 'p2', 'p10']}).termine).toBe(false);
    expect(carte({scenario_id: 'p10', scenario_termine: true}).termine).toBe(true);
    expect(carte({scenario_id: 'ps', scenario_termine: true}).termine).toBe(true);
  });

  it('une partie improvisée n’a rien de terminé', () => {
    expect(carte({scenario_id: null, scenario_termine: true}).termine).toBe(false);
  });

  it('un scénario terminé a tous ses chapitres joués, le dernier compris', () => {
    expect(carte({scenario_id: 'p10', scenario_termine: true}).reperes.map((r) => [r.etat, r.texte])).toEqual([
      ['joue', '1. Sacrilège à Satarla : joué'],
      ['joue', "2. De sable et d'eau : joué"],
      ['joue', '10. Épilogue : joué'],
    ]);
  });

  it('marque la dernière jouée, et garde l’ordre de l’API', () => {
    const cartes = partiesDeLAccueil(accueil([partie({id: 'a'}), partie({id: 'b'})], 'a'));

    expect(cartes.map((c) => [c.id, c.derniere])).toEqual([
      ['a', true],
      ['b', false],
    ]);
  });

  it('deux parties sur la même saga gardent la même teinte et chacune sa progression', () => {
    const [a, b] = partiesDeLAccueil(
      accueil([partie({id: 'a', scenario_id: 'p2', chapitres_joues: ['p1']}), partie({id: 'b', scenario_id: 'p1'})]),
    );

    expect(a.teinte).toBe(3);
    expect(b.teinte).toBe(3);
    expect(a.reperes.map((r) => r.etat)).toEqual(['joue', 'en-cours', 'a-jouer']);
    expect(b.reperes.map((r) => r.etat)).toEqual(['en-cours', 'a-jouer', 'a-jouer']);
  });

  it('annonce ce qu’un changement de chapitre retirerait : rien en combat, ni pour une partie improvisée', () => {
    expect(carte({figurants: 2}).figurantsARetirer).toBe(2);
    expect(carte({figurants: 2, statut: 'combat'}).figurantsARetirer).toBe(0);
    expect(carte({figurants: 2, scenario_id: null}).figurantsARetirer).toBe(0);
  });

  it('montre les héros : leur portrait utilisable, sinon leur initiale', () => {
    expect(carte({heros: [{id: 'h1', nom: 'axel', avatar: null}]}).heros).toEqual([{id: 'h1', nom: 'axel', portrait: null, initiale: 'A'}]);
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

describe('bandeauDePartie', () => {
  const SCENES = [
    {id: 's1', titre: 'La taverne'},
    {id: 's2', titre: 'Le trajet'},
    {id: 's3', titre: 'Le temple'},
    {id: 's4', titre: 'La nuit'},
  ];

  it('dit où en est l’histoire : la saga, le chapitre sur ceux de la saga, la scène, la compagnie et ses héros', () => {
    const bandeau = bandeauDePartie(
      partie({
        statut: 'combat',
        scenario_id: 'p1',
        scenes: SCENES,
        scene_id: 's4',
        scenes_jouees: ['s1', 's2', 's4'],
        heros: [{id: 'h1', nom: 'Axel', avatar: null}],
      }),
      S,
    );

    expect(bandeau).toEqual({
      id: 't',
      histoire: 'Perle du Beshaar',
      teinte: 3,
      chapitre: 'Chapitre 1 sur 3',
      scene: 'Scène 4 sur 4',
      titre: 'Les Lames de Satarla',
      sceneEnCours: 'La nuit',
      enCombat: true,
      scenes: [
        {etat: 'jouee', texte: 'Scène 1, La taverne : jouée'},
        {etat: 'jouee', texte: 'Scène 2, Le trajet : jouée'},
        {etat: 'a-jouer', texte: 'Scène 3, Le temple : à jouer'},
        {etat: 'en-cours', texte: 'Scène 4, La nuit : en cours'},
      ],
      scenesJouees: '2 scènes jouées sur 4',
      heros: [{id: 'h1', nom: 'Axel', portrait: null, initiale: 'A'}],
      filAriane: 'Les Lames de Satarla › Perle du Beshaar › Chapitre 1 › Scène 4 · La nuit',
    });
  });

  it('nomme l’introduction, et un chapitre sans numéro par son nom', () => {
    expect(bandeauDePartie(partie({scenario_id: 'dvi'}), S)).toMatchObject({
      chapitre: 'Introduction',
      scene: null,
      scenesJouees: null,
      filAriane: 'Les Lames de Satarla › Le Dieu voilé › Introduction',
    });
    expect(bandeauDePartie(partie({scenario_id: 'clm'}), S)).toMatchObject({chapitre: null, filAriane: 'Les Lames de Satarla › Chroniques lémuriennes › Mariage amer'});
  });

  it('dit « One shot » hors saga, « Sans scénario » quand on improvise, « Table sans nom » sans nom', () => {
    expect(bandeauDePartie(partie({scenario_id: 'ps'}), S)).toMatchObject({histoire: 'One shot', chapitre: null, teinte: 0});
    expect(bandeauDePartie(partie({scenario_id: null, titre: null}), S)).toMatchObject({
      histoire: 'Sans scénario',
      titre: 'Table sans nom',
      filAriane: 'Table sans nom › Sans scénario',
    });
  });

  it('ne situe pas une scène qui n’est pas de ce chapitre', () => {
    expect(bandeauDePartie(partie({scenes: SCENES, scene_id: 'ailleurs'}), S)).toMatchObject({scene: null, sceneEnCours: null});
  });
});
