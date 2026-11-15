import {ChangeDetectionStrategy, Component, input, model} from '@angular/core';
import {LibraryOption} from '../../models/library-rows.model';

/**
 * Un filtre à peu d'options dans la barre d'une bibliothèque en tuiles (la source ; le statut des héros) : ses options côte à côte, en
 * boutons bascule, chacune avec son nombre de fiches ; une est toujours choisie. Les styles sont ceux de `styles/_library-rows.scss`.
 */
@Component({
  selector: 'bol-library-segments',
  host: {class: 'dw-lr-seg', role: 'group', '[attr.aria-label]': 'titre()'},
  template: `
    @for (option of options(); track option.cle) {
      <button type="button" class="dw-lr-seg-option" [attr.aria-pressed]="valeur() === option.cle" (click)="valeur.set(option.cle)">
        {{ option.label }}<span class="dw-lr-seg-compte">{{ option.compte }}</span>
      </button>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibrarySegmentsComponent<T> {
  readonly titre = input.required<string>();
  readonly options = input.required<readonly LibraryOption<T>[]>();
  readonly valeur = model.required<T>();
}
