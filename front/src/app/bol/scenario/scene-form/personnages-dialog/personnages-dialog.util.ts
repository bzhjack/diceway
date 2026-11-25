import {BolSceneDistributionSaisie} from '../../../models/bol-scene.model';
import {CombatCatalogEntry} from '../../../models/combat-selection.model';
import {BolFicheScenario} from '../../../models/bol-fiche-scenario.model';
import {RANG_LABELS} from '../../../shared/library/library-rows-page.base';
import {scenariosDesFiches} from '../../../shared/library/library-scenarios.util';
import {LibraryOption, LibraryRang, LibraryScenarioOption, LibrarySource} from '../../../shared/models/library-rows.model';
import {PersonnageLigne, PersonnagesFiltres, PersonnageType} from '../../models/personnages-dialog.model';
import {cleDuPersonnage, KIND_LABEL, PERSONNAGES_MAX, QTY_MAX, rangDe} from '../scene-form.util';

/** Minuscules sans diacritiques : « Prêtre » et « pretre » se valent pour la recherche. */
function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

const TYPES: readonly {cle: PersonnageType; label: string}[] = [
  {cle: null, label: 'Tous'},
  {cle: 'hero', label: 'Héros'},
  {cle: 'pnj', label: 'PNJ'},
  {cle: 'creature', label: 'Créatures'},
  {cle: 'demon', label: 'Démons'},
];
const SOURCES: readonly {cle: LibrarySource; label: string}[] = [
  {cle: 'tout', label: 'Toutes'},
  {cle: 'catalogue', label: 'Catalogue commun'},
  {cle: 'miennes', label: 'Mes fiches'},
];

/** Les scénarios qui citent une fiche (ceux d'où elle a été importée). */
export function scenariosDe(fiche: CombatCatalogEntry): readonly BolFicheScenario[] {
  return (fiche.raw as {scenarios?: BolFicheScenario[]}).scenarios ?? [];
}

function sourceDe(fiche: CombatCatalogEntry): Exclude<LibrarySource, 'tout'> {
  return (fiche.raw as {user_id?: string | null}).user_id ? 'miennes' : 'catalogue';
}

/** Ce qu'une scène peut contenir : PNJ, créatures et démons, par nom. Pour la table (`herosAssis` donné), aussi les héros actifs du compte
 * qui n'y sont pas encore assis, en tête. */
export function fichesDeScene(catalogue: readonly CombatCatalogEntry[], herosAssis: readonly string[] | null = null): CombatCatalogEntry[] {
  const assis = new Set(herosAssis ?? []);
  const heros = herosAssis === null ? [] : catalogue.filter((fiche) => fiche.kind === 'hero' && (fiche.raw as {active?: boolean}).active !== false && !assis.has(String(fiche.sourceId)));
  const parNom = (a: CombatCatalogEntry, b: CombatCatalogEntry) => a.nom.localeCompare(b.nom, 'fr');
  return [...heros.sort(parNom), ...catalogue.filter((fiche) => fiche.kind !== 'hero').sort(parNom)];
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
      // Un héros n'a pas de rang ; aucun scénario ne le cite, mais il reste proposé quel que soit le scénario.
      (sauf === 'rang' || filtres.rang === null || (fiche.kind !== 'hero' && rangDe(fiche) === filtres.rang)) &&
      (sauf === 'scenarioId' || filtres.scenarioId === null || fiche.kind === 'hero' || scenariosDe(fiche).some((s) => s.id === filtres.scenarioId)) &&
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
    // « Héros » seulement quand il y en a à proposer (le casting de la table).
    types: TYPES.filter((o) => o.cle !== 'hero' || fiches.some((f) => f.kind === 'hero')).map((o) => ({
      ...o,
      compte: parType.filter((f) => o.cle === null || f.kind === o.cle).length,
    })),
    sources: SOURCES.map((o) => ({...o, compte: parSource.filter((f) => o.cle === 'tout' || sourceDe(f) === o.cle).length})),
    rangs: [
      {cle: null, label: 'Tous', compte: parRang.length},
      ...(['R', 'C', 'P'] as const).map((cle) => ({cle, label: RANG_LABELS[cle], compte: parRang.filter((f) => f.kind !== 'hero' && rangDe(f) === cle).length})),
    ],
    scenarios: scenariosDesFiches(avecScenarios(fiches), avecScenarios(filtrerFiches(fiches, filtres, 'scenarioId')), filtres.scenarioId),
  };
}

/** Les portraits : chaque fiche avec ce que la scène en a déjà. Son « + » ajoute un exemplaire d'une fiche déjà là (jusqu'à `QTY_MAX`),
 * ou fait entrer une fiche absente tant que la scène a de la place. */
export function lignesDesFiches(fiches: readonly CombatCatalogEntry[], personnages: readonly BolSceneDistributionSaisie[]): PersonnageLigne[] {
  const enScene = new Map(personnages.map((p) => [cleDuPersonnage(p.kind, p.source_id), p.qty]));
  const pleine = personnages.length >= PERSONNAGES_MAX;
  return fiches.map((fiche) => {
    const dansLaScene = enScene.get(cleDuPersonnage(fiche.kind, fiche.sourceId)) ?? 0;
    // Un héros n'entre qu'une fois.
    const ajoutable = dansLaScene === 0 ? !pleine : fiche.kind !== 'hero' && dansLaScene < QTY_MAX;
    const ajout = dansLaScene === 0 ? `Ajouter ${fiche.nom}` : fiche.kind === 'hero' ? `${fiche.nom} entre déjà` : `Un ${fiche.nom} de plus`;
    return {fiche, rang: rangDe(fiche), type: KIND_LABEL[fiche.kind], dansLaScene, ajoutable, ajout};
  });
}
