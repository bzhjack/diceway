import {BolFicheScenario} from '../../models/bol-fiche-scenario.model';
import {LibraryScenarioOption} from '../models/library-rows.model';

/** Couleurs des scénarios (`dw-saga--1` à `--4`), comme sur l'accueil : dans l'ordre alphabétique de leur titre. */
const TEINTES = 4;

/**
 * Les scénarios qui ont créé ou citent au moins une fiche, par titre, chacun avec sa teinte et son nombre de fiches. Les teintes se
 * donnent sur `fiches` (elles ne changent pas quand un filtre change) ; les nombres se comptent dans `compterDans` (les fiches que
 * gardent les autres filtres), un scénario qui n'y cite plus rien disparaît, sauf celui choisi (`garder`), qu'on doit pouvoir retirer.
 */
export function scenariosDesFiches(
  fiches: readonly {scenarios?: readonly BolFicheScenario[]}[],
  compterDans: readonly {scenarios?: readonly BolFicheScenario[]}[] = fiches,
  garder: string | null = null,
): LibraryScenarioOption[] {
  const titres = new Map<string, string>();
  for (const fiche of fiches) {
    for (const scenario of fiche.scenarios ?? []) {
      titres.set(scenario.id, scenario.titre);
    }
  }
  const comptes = new Map<string, number>();
  for (const fiche of compterDans) {
    for (const scenario of fiche.scenarios ?? []) {
      comptes.set(scenario.id, (comptes.get(scenario.id) ?? 0) + 1);
    }
  }
  return [...titres.entries()]
    .sort(([, a], [, b]) => a.localeCompare(b, 'fr'))
    .map(([id, titre], i) => ({id, titre, teinte: (i % TEINTES) + 1, compte: comptes.get(id) ?? 0}))
    .filter((scenario) => scenario.compte > 0 || scenario.id === garder);
}
