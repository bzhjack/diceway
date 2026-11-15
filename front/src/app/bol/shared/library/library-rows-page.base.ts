import {Signal, computed, signal} from '@angular/core';
import {BolFicheScenario} from '../../models/bol-fiche-scenario.model';
import {LibraryOption, LibraryRang, LibraryScenarioOption, LibrarySource} from '../models/library-rows.model';
import {BolLibraryPageBase} from './library-page.base';
import {scenariosDesFiches} from './library-scenarios.util';

export const RANG_LABELS: Record<LibraryRang, string> = {R: 'Rival', C: 'Coriace', P: 'Piétaille'};

/** Le compte que disent l'en-tête et la barre d'une bibliothèque : « 103 créatures », ou « 75 sur 103 créatures » quand un filtre en écarte. */
export function compteDit(gardees: number, total: number, singulier: string, pluriel: string): string {
  const nom = total > 1 ? pluriel : singulier;
  return gardees === total ? `${total} ${nom}` : `${gardees} sur ${total} ${nom}`;
}

/** Socle d'une bibliothèque en tuiles (créatures, démons, PNJ, héros) : les fiches rangées par nom. La sous-classe donne le nom d'une fiche. */
export abstract class BolLibraryRowsPageBase<TItem extends {id?: string | number | null}> extends BolLibraryPageBase<TItem> {
  protected abstract nomDe(item: TItem): string;


  /** Les fiches par nom. */
  protected trierLes(items: readonly TItem[]): TItem[] {
    return [...items].sort((a, b) => this.nomDe(a).localeCompare(this.nomDe(b), 'fr'));
  }
}

/**
 * Une bibliothèque de fiches du catalogue et du compte (créatures, démons, PNJ) : les filtres partagés, chacun avec son nombre de
 * fiches. La source (tout, catalogue commun, mes fiches), le scénario (ceux qui ont créé ou citent une fiche) et le rang ; la
 * sous-classe ajoute le sien (taille, catégorie, région).
 */
export abstract class BolFichesPageBase<
  TItem extends {id?: string | number | null; user_id: string | null; scenarios?: BolFicheScenario[]},
> extends BolLibraryRowsPageBase<TItem> {
  protected abstract readonly fiches: Signal<readonly TItem[]>;
  protected abstract rangDe(item: TItem): LibraryRang;

  protected readonly source = signal<LibrarySource>('tout');
  protected readonly scenarioId = signal<string | null>(null);
  protected readonly rang = signal<LibraryRang | null>(null);

  protected readonly totalCount = computed(() => this.fiches().length);

  protected readonly sources = computed((): LibraryOption<LibrarySource>[] => {
    const fiches = this.fiches();
    const miennes = fiches.filter((f) => Boolean(f.user_id)).length;
    return [
      {cle: 'tout', label: 'Tous', compte: fiches.length},
      {cle: 'catalogue', label: 'Catalogue', compte: fiches.length - miennes},
      {cle: 'miennes', label: 'Mes fiches', compte: miennes},
    ];
  });

  /** Les scénarios qui ont créé ou citent au moins une fiche, par titre : leur teinte et leur nombre de fiches. */
  protected readonly scenarios = computed((): LibraryScenarioOption[] => scenariosDesFiches(this.fiches()));

  protected readonly rangs = computed((): LibraryOption<LibraryRang | null>[] => {
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
