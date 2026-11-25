import {CombatCatalogEntry} from '../../../models/combat-selection.model';
import {PersonnagesFiltres} from '../../models/personnages-dialog.model';
import {avecLaFiche} from '../scene-form.util';
import {fichesDeScene, filtrerFiches, lignesDesFiches, optionsDesFiltres} from './personnages-dialog.util';

function fiche(kind: string, nom: string, raw: Record<string, unknown>): CombatCatalogEntry {
  return {catalogId: `${kind}:${nom}`, kind, sourceId: nom, nom, vitalite: 5, avatar: '', raw} as unknown as CombatCatalogEntry;
}

const DIEU = {id: 'dv', titre: 'Le Dieu voilé'};
const PERLE = {id: 'pb', titre: 'Perle du Beshaar'};
const CATALOGUE = [
  fiche('hero', 'Dogon', {user_id: 'u', active: true}),
  fiche('hero', 'Kaja', {user_id: 'u', active: true}),
  fiche('hero', 'Novice', {user_id: 'u', active: false}),
  fiche('pnj', 'Drajit', {user_id: 'u', type: 'R', scenarios: [DIEU]}),
  fiche('pnj', 'Aubergiste', {user_id: null, type: 'C', scenarios: [PERLE]}),
  fiche('creature', 'Loup', {user_id: null, rang: 'pietaille', scenarios: [DIEU, PERLE]}),
  fiche('demon', 'Xothar', {user_id: 'u', type: 'R'}),
];
const TOUT: PersonnagesFiltres = {type: null, source: 'tout', rang: null, scenarioId: null, recherche: ''};

describe('les fiches d’« Ajouter des personnages »', () => {
  const fiches = fichesDeScene(CATALOGUE);

  it('ne propose ni héros, et range par nom', () => {
    expect(fiches.map((f) => f.nom)).toEqual(['Aubergiste', 'Drajit', 'Loup', 'Xothar']);
  });

  it('filtre par type, source, rang, scénario et nom', () => {
    const noms = (filtres: Partial<PersonnagesFiltres>) => filtrerFiches(fiches, {...TOUT, ...filtres}).map((f) => f.nom);

    expect(noms({type: 'pnj'})).toEqual(['Aubergiste', 'Drajit']);
    expect(noms({source: 'miennes'})).toEqual(['Drajit', 'Xothar']);
    expect(noms({rang: 'R'})).toEqual(['Drajit', 'Xothar']);
    expect(noms({rang: 'P'})).toEqual(['Loup']);
    expect(noms({scenarioId: 'dv'})).toEqual(['Drajit', 'Loup']);
    expect(noms({recherche: 'auberg'})).toEqual(['Aubergiste']);
    expect(noms({recherche: '  DRÂJIT '})).toEqual(['Drajit']);
  });

  it('compte ce que chaque option montrerait, les autres filtres appliqués', () => {
    const options = optionsDesFiltres(fiches, {...TOUT, scenarioId: 'dv'});

    expect(options.types.map((o) => [o.cle, o.compte])).toEqual([[null, 2], ['pnj', 1], ['creature', 1], ['demon', 0]]);
    expect(options.sources.map((o) => o.compte)).toEqual([2, 1, 1]);
    expect(options.rangs.map((o) => [o.cle, o.compte])).toEqual([[null, 2], ['R', 1], ['C', 0], ['P', 1]]);
  });

  it('les scénarios gardent leur teinte quand un filtre change ; un scénario qui ne cite plus rien disparaît', () => {
    const tous = optionsDesFiltres(fiches, TOUT).scenarios;
    const demons = optionsDesFiltres(fiches, {...TOUT, type: 'pnj', rang: 'C'}).scenarios;

    expect(tous.map((o) => [o.titre, o.teinte, o.compte])).toEqual([['Le Dieu voilé', 1, 2], ['Perle du Beshaar', 2, 2]]);
    expect(demons.map((o) => [o.titre, o.teinte, o.compte])).toEqual([['Perle du Beshaar', 2, 1]]);
  });

  describe('pour la table', () => {
    const pourLaTable = fichesDeScene(CATALOGUE, ['Dogon']);

    it('propose en tête les héros actifs qui ne sont pas encore assis', () => {
      expect(pourLaTable.map((f) => f.nom)).toEqual(['Kaja', 'Aubergiste', 'Drajit', 'Loup', 'Xothar']);
      expect(optionsDesFiltres(fiches, TOUT).types.map((o) => o.cle)).not.toContain('hero');
      expect(optionsDesFiltres(pourLaTable, TOUT).types.find((o) => o.cle === 'hero')?.compte).toBe(1);
    });

    it('un héros n’a pas de rang, mais reste proposé quel que soit le scénario', () => {
      const noms = (filtres: Partial<PersonnagesFiltres>) => filtrerFiches(pourLaTable, {...TOUT, ...filtres}).map((f) => f.nom);

      expect(noms({type: 'hero'})).toEqual(['Kaja']);
      expect(noms({rang: 'C'})).toEqual(['Aubergiste']);
      expect(noms({scenarioId: 'dv'})).toEqual(['Kaja', 'Drajit', 'Loup']);
    });

    it('un héros entre une fois, dans le camp des héros', () => {
      const kaja = pourLaTable[0];
      const une = avecLaFiche([], kaja);

      expect(une).toEqual([{kind: 'hero', source_id: 'Kaja', qty: 1, camp: 'heros', attitude: null}]);
      expect(avecLaFiche(une, kaja)).toEqual(une);
      expect(lignesDesFiches([kaja], une)[0]).toEqual(expect.objectContaining({dansLaScene: 1, ajoutable: false}));
    });
  });
});
