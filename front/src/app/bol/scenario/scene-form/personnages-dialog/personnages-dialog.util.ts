import {CombatCatalogEntry} from '../../../models/combat-selection.model';
import {BolFicheScenario} from '../../../models/bol-fiche-scenario.model';
import {normalizeSearch} from '../../../session/play/reserve/reserve.util';
import {combatantRankKey} from '../../../session/combat-statblock.util';
import {RANG_LABELS} from '../../../shared/library/library-rows-page.base';
import {scenariosDesFiches} from '../../../shared/library/library-scenarios.util';
import {LibraryOption, LibraryRang, LibraryScenarioOption, LibrarySource} from '../../../shared/models/library-rows.model';
import {PersonnagesFiltres, PersonnageType} from '../../models/personnages-dialog.model';

const TYPES: readonly {cle: PersonnageType; label: string}[] = [
  {cle: null, label: 'Tous'},
  {cle: 'pnj', label: 'PNJ'},
  {cle: 'creature', label: 'Créatures'},
  {cle: 'demon', label: 'Démons'},
];
const SOURCES: readonly {cle: LibrarySource; label: string}[] = [
  {cle: 'tout', label: 'Toutes'},
  {cle: 'catalogue', label: 'Catalogue commun'},
  {cle: 'miennes', label: 'Mes fiches'},
];
const RANG_DE_LA_CLE = {rival: 'R', coriace: 'C', pietaille: 'P'} as const;

/** Les scénarios qui citent une fiche (ceux d'où elle a été importée). */
export function scenariosDe(fiche: CombatCatalogEntry): readonly BolFicheScenario[] {
  return (fiche.raw as {scenarios?: BolFicheScenario[]}).scenarios ?? [];
}

/** Le rang d'une fiche, en lettre comme dans les bibliothèques (`dw-lr-rang--R`). */
export function rangDe(fiche: CombatCatalogEntry): LibraryRang {
  const cle = combatantRankKey(fiche);
  return cle ? RANG_DE_LA_CLE[cle] : 'C';
}

function sourceDe(fiche: CombatCatalogEntry): Exclude<LibrarySource, 'tout'> {
  return (fiche.raw as {user_id?: string | null}).user_id ? 'miennes' : 'catalogue';
}

/** Ce qu'une scène peut contenir : PNJ, créatures et démons (pas de héros), par nom. */
export function fichesDeScene(catalogue: readonly CombatCatalogEntry[]): CombatCatalogEntry[] {
  return catalogue.filter((fiche) => fiche.kind !== 'hero').sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

/** Les fiches que montrent ces filtres ; `sauf` en ignore un, pour compter ce que chacune de ses options montrerait. */
export function filtrerFiches(
  fiches: readonly CombatCatalogEntry[],
  filtres: PersonnagesFiltres,
  sauf: keyof PersonnagesFiltres | null = null,
): CombatCatalogEntry[] {
  const terme = normalizeSearch(filtres.recherche);
  return fiches.filter(
    (fiche) =>
      (sauf === 'type' || filtres.type === null || fiche.kind === filtres.type) &&
      (sauf === 'source' || filtres.source === 'tout' || sourceDe(fiche) === filtres.source) &&
      (sauf === 'rang' || filtres.rang === null || rangDe(fiche) === filtres.rang) &&
      (sauf === 'scenarioId' || filtres.scenarioId === null || scenariosDe(fiche).some((s) => s.id === filtres.scenarioId)) &&
      (sauf === 'recherche' || !terme || normalizeSearch(fiche.nom).includes(terme)),
  );
}

/** Les options de chaque filtre, chacune avec ce qu'elle montrerait (les autres filtres appliqués) ; les scénarios gardent la teinte
 * qu'ils ont dans les bibliothèques. */
export function optionsDesFiltres(
  fiches: readonly CombatCatalogEntry[],
  filtres: PersonnagesFiltres,
): {types: LibraryOption<PersonnageType>[]; sources: LibraryOption<LibrarySource>[]; rangs: LibraryOption<LibraryRang | null>[]; scenarios: LibraryScenarioOption[]} {
  const parType = filtrerFiches(fiches, filtres, 'type');
  const parSource = filtrerFiches(fiches, filtres, 'source');
  const parRang = filtrerFiches(fiches, filtres, 'rang');
  const avecScenarios = (liste: readonly CombatCatalogEntry[]) => liste.map((fiche) => ({scenarios: scenariosDe(fiche)}));
  return {
    types: TYPES.map((o) => ({...o, compte: parType.filter((f) => o.cle === null || f.kind === o.cle).length})),
    sources: SOURCES.map((o) => ({...o, compte: parSource.filter((f) => o.cle === 'tout' || sourceDe(f) === o.cle).length})),
    rangs: [
      {cle: null, label: 'Tous', compte: parRang.length},
      ...(['R', 'C', 'P'] as const).map((cle) => ({cle, label: RANG_LABELS[cle], compte: parRang.filter((f) => rangDe(f) === cle).length})),
    ],
    scenarios: scenariosDesFiches(avecScenarios(fiches), avecScenarios(filtrerFiches(fiches, filtres, 'scenarioId')), filtres.scenarioId),
  };
}
