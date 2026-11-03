import {BolAccueilScenario} from '../models/bol-accueil.model';

/** Le scénario d'id `id` parmi ceux de l'accueil ; null sans id ou pour un id inconnu. Partagé par l'accueil et la nouvelle table. */
export function findScenario(scenarios: readonly BolAccueilScenario[], id: string | null): BolAccueilScenario | null {
  return id === null ? null : (scenarios.find((s) => s.id === id) ?? null);
}
