import {BolSceneDistributionSaisie} from '../../../models/bol-scene.model';

/** Ce que dit la table quand le casting y fait entrer des personnages : « 3 personnages rejoignent la table. », et les fiches
 * qui n'ont pas pu s'asseoir (disparues depuis). */
export function arriveeALaTable(personnages: readonly BolSceneDistributionSaisie[], ignores: number): string {
  const nombre = personnages.reduce((somme, p) => somme + p.qty, 0);
  const arrivee = nombre === 1 ? 'Un personnage rejoint la table.' : `${nombre} personnages rejoignent la table.`;
  if (ignores === 0) {
    return arrivee;
  }
  return `${arrivee} ${ignores === 1 ? 'Une fiche introuvable a été laissée de côté.' : `${ignores} fiches introuvables ont été laissées de côté.`}`;
}
