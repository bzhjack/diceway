import {BolAccueilScenario} from '../models/bol-accueil.model';
import {BolScenarioSaga} from '../models/bol-scenario.model';

/** Ce qu'il faut d'un chapitre pour le nommer : son nom, son numéro et son scénario. */
interface ChapitreNomme {
  readonly titre: string;
  readonly numero?: number | null;
  readonly saga?: BolScenarioSaga | null;
}

/** Le scénario d'id `id` parmi ceux de l'accueil ; null sans id ou pour un id inconnu. Partagé par l'accueil et la nouvelle table. */
export function findScenario(scenarios: readonly BolAccueilScenario[], id: string | null): BolAccueilScenario | null {
  return id === null ? null : (scenarios.find((s) => s.id === id) ?? null);
}

/** Un chapitre comme les écrans le nomment : « 1. Sacrilège à Satarla », « Introduction : La colère de Nemmereth », ou son nom seul. */
export function libelleDeChapitre(numero: number | null | undefined, titre: string): string {
  if (numero === null || numero === undefined) {
    return titre;
  }
  if (numero === 0) {
    return titre.toLocaleLowerCase('fr') === 'introduction' ? titre : `Introduction : ${titre}`;
  }
  return `${numero}. ${titre}`;
}

/** Un chapitre avec son scénario, d'un seul tenant : « Perle du Beshaar — 1. Sacrilège à Satarla » ; un one shot, son nom seul. */
export function titreDeChapitre(chapitre: ChapitreNomme): string {
  const libelle = libelleDeChapitre(chapitre.numero, chapitre.titre);
  return chapitre.saga ? `${chapitre.saga.titre} — ${libelle}` : libelle;
}
