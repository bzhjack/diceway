import {ChangeDetectionStrategy, Component, computed, input, model} from '@angular/core';
import {LibraryOption, LibraryScenarioOption, LibrarySource} from '../../models/library-rows.model';
import {LibraryFacetteComponent} from '../library-facette/library-facette';

/**
 * Les filtres partagés d'une bibliothèque de fiches, dans sa barre, chacun en liste : la source (catalogue, mes fiches), le scénario (une liste, chacun à la teinte
 * de sa saga ; absent tant qu'aucun scénario importé ne cite de fiche), puis ceux que la page projette (rang, taille, catégorie, région),
 * chaque option avec son nombre de fiches. Les styles sont ceux de `styles/_library-rows.scss`.
 */
@Component({
  selector: 'bol-library-facettes',
  imports: [LibraryFacetteComponent],
  template: `
    <bol-library-facette titre="Source" tous="Toutes les sources" [total]="total()" [options]="sourceOptions()" [(valeur)]="source" [vide]="'tout'" />
    @if (scenarioOptions().length) {
      <bol-library-facette
        titre="Scénario"
        tous="Tous les scénarios"
        [total]="total()"
        [options]="scenarioOptions()"
        [(valeur)]="scenarioId"
        [vide]="null"
      />
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryFacettesComponent {
  readonly sources = input.required<readonly LibraryOption<LibrarySource>[]>();
  readonly scenarios = input.required<readonly LibraryScenarioOption[]>();
  readonly source = model.required<LibrarySource>();
  readonly scenarioId = model.required<string | null>();

  /** Toutes les fiches de la bibliothèque : le nombre de « Tous les scénarios ». */
  protected readonly total = computed(() => this.sources().find((s) => s.cle === 'tout')?.compte);
  /** Le catalogue et les fiches du compte ; « Toutes les sources » est l'option qui retire le filtre. */
  protected readonly sourceOptions = computed(() => this.sources().filter((s) => s.cle !== 'tout'));
  protected readonly scenarioOptions = computed((): LibraryOption<string | null>[] =>
    this.scenarios().map((s) => ({cle: s.id, label: s.titre, teinte: s.teinte, compte: s.compte})),
  );
}
