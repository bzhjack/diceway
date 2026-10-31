import {ChangeDetectionStrategy, Component, input} from '@angular/core';

/** La grille d'une bibliothèque : ses cartes (contenu projeté) défilent dans la page, ou un message quand aucune ne correspond à la recherche. */
@Component({
  selector: 'dw-library-grid',
  template: `
    <div class="dw-lg-scroll">
      <div class="dw-lg">
        <ng-content />
        @if (empty()) {
          <p class="dw-lg-empty">{{ emptyMessage() }}</p>
        }
      </div>
    </div>
  `,
  styleUrl: './dw-library-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwLibraryGridComponent {
  readonly empty = input.required<boolean>();
  readonly emptyMessage = input.required<string>();
}
