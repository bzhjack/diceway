import {ChangeDetectionStrategy, Component, input, model} from '@angular/core';
import {LibraryOption} from '../../models/library-rows.model';

let suivant = 0;

/** Un filtre à choix unique d'une colonne de filtres (bibliothèques en tuiles, « Ajouter des personnages ») : son titre, puis une
 * option par valeur, en boutons bascule, chacune avec son nombre de fiches. Les styles sont ceux de `styles/_library-rows.scss`. */
@Component({
  selector: 'bol-library-facette',
  template: `
    <section class="dw-lr-facette" [attr.aria-labelledby]="titreId">
      <h2 class="dw-lr-facette-titre" [id]="titreId">{{ titre() }}</h2>
      @for (option of options(); track option.cle) {
        <button type="button" class="dw-lr-option" [attr.aria-pressed]="valeur() === option.cle" (click)="valeur.set(option.cle)">
          <span class="dw-lr-option-label">{{ option.label }}</span>
          <span class="dw-lr-option-compte">{{ option.compte }}</span>
        </button>
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
export class LibraryFacetteComponent<T> {
  readonly titre = input.required<string>();
  readonly options = input.required<readonly LibraryOption<T>[]>();
  readonly valeur = model.required<T>();

  protected readonly titreId = `dw-lr-facette-${++suivant}`;
}
