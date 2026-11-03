import {BolAccueilScenario} from '../models/bol-accueil.model';

/**
 * Pour les tests : un chapitre de l'accueil écrit d'un seul tenant, comme dans les fichiers d'import (« Perle du Beshaar — 1. Sacrilège à
 * Satarla », « Le Dieu voilé — Introduction : … », « mon one shot »), découpé comme le fait l'API. Un même scénario, quelle que soit la casse
 * de son nom, a le même id ; son nom est celui écrit dans ce chapitre.
 */
export function chapitre(id: string, complet: string): BolAccueilScenario {
  const coupe = complet.indexOf(' — ');
  const saga = coupe >= 0 ? complet.slice(0, coupe).trim() : '';
  const libelle = coupe >= 0 ? complet.slice(coupe + 3).trim() : '';
  if (!saga || !libelle) {
    return {id, titre: complet, numero: null, saga: null};
  }
  const sagaRef = {id: `saga:${saga.toLocaleLowerCase('fr')}`, titre: saga};
  const intro = /^introduction\s*(?::\s*(.*))?$/i.exec(libelle);
  if (intro) {
    return {id, titre: intro[1]?.trim() || libelle, numero: 0, saga: sagaRef};
  }
  const numero = /^(\d+)\.\s*(.+)$/.exec(libelle);
  return numero
    ? {id, titre: numero[2].trim(), numero: Number(numero[1]), saga: sagaRef}
    : {id, titre: libelle, numero: null, saga: sagaRef};
}
