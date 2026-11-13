import {ChangeDetectionStrategy, Component, input, model} from '@angular/core';
import {LibraryOption, LibraryScenarioOption, LibrarySource} from '../../models/library-rows.model';
import {LibraryFacetteComponent} from '../library-facette/library-facette';

/**
 * Les filtres partagés d'une bibliothèque en tuiles, à poser dans sa colonne de filtres : la source et le scénario (à la teinte de sa
 * saga), chacun avec son nombre de fiches. Un second clic sur un scénario le retire. Le rang est une liste de la barre de recherche
 * (`bol-library-rang`). Les styles sont ceux de `styles/_library-rows.scss`.
 */
@Component({
  selector: 'bol-library-facettes',
  imports: [LibraryFacetteComponent],
  template: `
    <bol-library-facette titre="Source" [options]="sources()" [(valeur)]="source" />

    <section class="dw-lr-facette" aria-labelledby="dw-lr-f-scenario">
      <h2 id="dw-lr-f-scenario" class="dw-lr-facette-titre">Scénario</h2>
      @for (scenario of scenarios(); track scenario.id) {
        <button
          type="button"
          class="dw-lr-option"
          [class]="'dw-saga--' + scenario.teinte"
          [attr.aria-pressed]="scenarioId() === scenario.id"
          (click)="basculerScenario(scenario.id)"
        >
          <span class="dw-lr-point" aria-hidden="true"></span>
          <span class="dw-lr-option-label">{{ scenario.titre }}</span>
          <span class="dw-lr-option-compte">{{ scenario.compte }}</span>
        </button>
      } @empty {
        <p class="dw-lr-facette-vide">Aucun scénario importé n’en cite encore.</p>
      }
    </section>
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

  protected basculerScenario(id: string): void {
    this.scenarioId.update((courant) => (courant === id ? null : id));
  }
}
