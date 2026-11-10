import {BolFicheScenario} from '../../../models/bol-fiche-scenario.model';
import {CombatCatalogEntry} from '../../../models/combat-selection.model';
import {normalizeSearch} from '../../../session/play/reserve/reserve.util';
import {combatantRankKey} from '../../../session/combat-statblock.util';
import {PersonnageRang, PersonnageSource, PersonnagesFiltres, PersonnagesOption, PersonnageType} from '../../models/personnages-dialog.model';

const TYPES: readonly {cle: PersonnageType; label: string}[] = [
  {cle: 'tous', label: 'Tous'},
  {cle: 'pnj', label: 'PNJ'},
  {cle: 'creature', label: 'Créatures'},
  {cle: 'demon', label: 'Démons'},
];
const SOURCES: readonly {cle: PersonnageSource; label: string}[] = [
  {cle: 'tout', label: 'Toutes'},
  {cle: 'catalogue', label: 'Catalogue'},
  {cle: 'compte', label: 'Mes fiches'},
];
const RANGS: readonly {cle: PersonnageRang; label: string}[] = [
  {cle: 'tous', label: 'Tous'},
  {cle: 'rival', label: 'Rival'},
  {cle: 'coriace', label: 'Coriace'},
  {cle: 'pietaille', label: 'Piétaille'},
];

/** Les scénarios qui citent une fiche (ceux d'où elle a été importée). */
export function scenariosDe(fiche: CombatCatalogEntry): readonly BolFicheScenario[] {
  return (fiche.raw as {scenarios?: BolFicheScenario[]}).scenarios ?? [];
}

function sourceDe(fiche: CombatCatalogEntry): Exclude<PersonnageSource, 'tout'> {
  return (fiche.raw as {user_id?: string | null}).user_id ? 'compte' : 'catalogue';
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
      (sauf === 'type' || filtres.type === 'tous' || fiche.kind === filtres.type) &&
      (sauf === 'source' || filtres.source === 'tout' || sourceDe(fiche) === filtres.source) &&
      (sauf === 'rang' || filtres.rang === 'tous' || combatantRankKey(fiche) === filtres.rang) &&
      (sauf === 'scenarioId' || filtres.scenarioId === null || scenariosDe(fiche).some((s) => s.id === filtres.scenarioId)) &&
      (sauf === 'recherche' || !terme || normalizeSearch(fiche.nom).includes(terme)),
  );
}

/** Les options du type, de la source et du rang, chacune avec ce qu'elle montrerait. */
export function optionsDesFiltres(fiches: readonly CombatCatalogEntry[], filtres: PersonnagesFiltres) {
  const parType = filtrerFiches(fiches, filtres, 'type');
  const parSource = filtrerFiches(fiches, filtres, 'source');
  const parRang = filtrerFiches(fiches, filtres, 'rang');
  return {
    types: TYPES.map((o): PersonnagesOption<PersonnageType> => ({...o, compte: parType.filter((f) => o.cle === 'tous' || f.kind === o.cle).length})),
    sources: SOURCES.map((o): PersonnagesOption<PersonnageSource> => ({...o, compte: parSource.filter((f) => o.cle === 'tout' || sourceDe(f) === o.cle).length})),
    rangs: RANGS.map((o): PersonnagesOption<PersonnageRang> => ({...o, compte: parRang.filter((f) => o.cle === 'tous' || combatantRankKey(f) === o.cle).length})),
  };
}

/** Les scénarios cités par les fiches (les autres filtres appliqués), par titre, chacun avec son nombre de fiches. */
export function scenariosDesFiches(fiches: readonly CombatCatalogEntry[], filtres: PersonnagesFiltres): PersonnagesOption<string>[] {
  const parId = new Map<string, PersonnagesOption<string>>();
  for (const fiche of filtrerFiches(fiches, filtres, 'scenarioId')) {
    for (const scenario of scenariosDe(fiche)) {
      const option = parId.get(scenario.id) ?? {cle: scenario.id, label: scenario.titre, compte: 0};
      parId.set(scenario.id, {...option, compte: option.compte + 1});
    }
  }
  return [...parId.values()].sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}
