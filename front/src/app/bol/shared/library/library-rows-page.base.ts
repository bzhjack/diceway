import {Signal, computed, signal} from '@angular/core';
import {BolFicheScenario} from '../../models/bol-fiche-scenario.model';
import {
  LibraryOption,
  LibraryRang,
  LibraryScenarioOption,
  LibrarySource,
  LibraryTri,
  LibraryTriOption,
} from '../models/library-rows.model';
import {BolLibraryPageBase} from './library-page.base';
import {scenariosDesFiches} from './library-scenarios.util';

export const RANG_LABELS: Record<LibraryRang, string> = {R: 'Rival', C: 'Coriace', P: 'Piétaille'};

/** Le tri par type va de la piétaille au rival. */
export const ORDRE_DES_RANGS: Record<LibraryRang, number> = {P: 0, C: 1, R: 2};

/**
 * Socle d'une bibliothèque en tuiles (créatures, démons, PNJ, héros) : le tri, choisi dans la liste « Trier par » (`bol-library-tri`),
 * dont un bouton inverse le sens. La sous-classe donne ses options de tri, la valeur de tri de chacune et le nom d'une fiche (pour
 * départager).
 */
export abstract class BolLibraryRowsPageBase<TItem extends {id?: string | number | null}, TTri extends string> extends BolLibraryPageBase<TItem> {
  protected abstract valeurDeTri(item: TItem, cle: TTri): number | string;
  protected abstract nomDe(item: TItem): string;

  /** Par nom d'abord : chaque bibliothèque trie par `nom`. */
  protected readonly tri = signal<LibraryTri<TTri>>({cle: 'nom' as TTri, croissant: true});

  /** Les choix de la liste « Trier par » (`bol-library-tri`). */
  protected abstract readonly optionsDeTri: readonly LibraryTriOption<TTri>[];

  /** Trie sur cette clé (une de `optionsDeTri`), dans l'ordre croissant ; la clé déjà choisie ne change rien. */
  protected trierPar(cle: string): void {
    this.tri.update((tri) => (tri.cle === cle ? tri : {cle: cle as TTri, croissant: true}));
  }

  /** Inverse le sens du tri. */
  protected inverserLeSens(): void {
    this.tri.update((tri) => ({...tri, croissant: !tri.croissant}));
  }

  /** Les fiches dans l'ordre du tri, puis par nom. */
  protected trierLes(items: readonly TItem[]): TItem[] {
    const {cle, croissant} = this.tri();
    const sens = croissant ? 1 : -1;
    return [...items].sort((a, b) => {
      const va = this.valeurDeTri(a, cle);
      const vb = this.valeurDeTri(b, cle);
      const ecart = typeof va === 'string' ? va.localeCompare(String(vb), 'fr') : va - Number(vb);
      return sens * ecart || this.nomDe(a).localeCompare(this.nomDe(b), 'fr');
    });
  }
}

/**
 * Une bibliothèque de fiches du catalogue et du compte (créatures, démons, PNJ) : en plus du tri, les filtres partagés, chacun avec son
 * nombre de fiches. La source (tout, catalogue commun, mes fiches), le scénario (ceux qui ont créé ou citent une fiche) et le rang ; la
 * sous-classe ajoute le sien (taille, catégorie, région).
 */
export abstract class BolFichesPageBase<
  TItem extends {id?: string | number | null; user_id: string | null; scenarios?: BolFicheScenario[]},
  TTri extends string,
> extends BolLibraryRowsPageBase<TItem, TTri> {
  protected abstract readonly fiches: Signal<readonly TItem[]>;
  /** « Tout le bestiaire », « Tous les PNJ »… */
  protected abstract readonly libelleTout: string;
  protected abstract rangDe(item: TItem): LibraryRang;

  protected readonly source = signal<LibrarySource>('tout');
  protected readonly scenarioId = signal<string | null>(null);
  protected readonly rang = signal<LibraryRang | null>(null);

  protected readonly totalCount = computed(() => this.fiches().length);

  protected readonly sources = computed((): LibraryOption<LibrarySource>[] => {
    const fiches = this.fiches();
    const miennes = fiches.filter((f) => Boolean(f.user_id)).length;
    return [
      {cle: 'tout', label: this.libelleTout, compte: fiches.length},
      {cle: 'catalogue', label: 'Catalogue commun', compte: fiches.length - miennes},
      {cle: 'miennes', label: 'Mes fiches', compte: miennes},
    ];
  });

  /** Les scénarios qui ont créé ou citent au moins une fiche, par titre : leur teinte et leur nombre de fiches. */
  protected readonly scenarios = computed((): LibraryScenarioOption[] => scenariosDesFiches(this.fiches()));

  protected readonly rangs = computed((): LibraryOption<LibraryRang>[] => {
    const fiches = this.fiches();
    return (['R', 'C', 'P'] as const).map((cle) => ({cle, label: RANG_LABELS[cle], compte: fiches.filter((f) => this.rangDe(f) === cle).length}));
  });

  /** Un filtre partagé est posé (la sous-classe ajoute les siens à `filtresActifs`). */
  protected readonly facettesActives = computed(() => this.source() !== 'tout' || this.scenarioId() !== null || this.rang() !== null);

  /** Les fiches que gardent la source, le scénario et le rang choisis. */
  protected filtrerParFacettes(fiches: readonly TItem[]): TItem[] {
    const source = this.source();
    const scenarioId = this.scenarioId();
    const rang = this.rang();
    return fiches
      .filter((f) => source === 'tout' || (source === 'miennes') === Boolean(f.user_id))
      .filter((f) => scenarioId === null || (f.scenarios ?? []).some((s) => s.id === scenarioId))
      .filter((f) => rang === null || this.rangDe(f) === rang);
  }

  protected effacerFacettes(): void {
    this.source.set('tout');
    this.scenarioId.set(null);
    this.rang.set(null);
  }

  /** Les termes de recherche qu'une fiche doit aux scénarios qui la citent. */
  protected titresDesScenarios(fiche: TItem): string[] {
    return (fiche.scenarios ?? []).map((s) => s.titre);
  }
}
