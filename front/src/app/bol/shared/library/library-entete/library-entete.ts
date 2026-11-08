import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {LibraryColonneVue} from '../../models/library-rows.model';

/**
 * La ligne d'en-têtes d'une bibliothèque en lignes, posée sur le `<tr>` du `<thead>` : chaque colonne triable est un bouton qui dit son
 * sens (`aria-sort` sur sa cellule), un en-tête abrégé donne le mot entier en bulle, la dernière cellule nomme les actions pour les
 * lecteurs d'écran. Les styles sont ceux de `styles/_library-rows.scss`.
 */
@Component({
  selector: 'tr[bol-library-entete]',
  imports: [MatIconModule],
  template: `
    @for (colonne of colonnes(); track colonne.label) {
      <th scope="col" [class.dw-lr-num]="colonne.num" [attr.aria-sort]="colonne.ariaSort">
        @if (colonne.cle; as cle) {
          <button type="button" class="dw-lr-tri" (click)="trier.emit(cle)">
            @if (colonne.titre; as titre) {
              <abbr [title]="titre">{{ colonne.label }}</abbr>
            } @else {
              {{ colonne.label }}
            }
            @if (colonne.icone; as icone) {
              <mat-icon aria-hidden="true">{{ icone }}</mat-icon>
            }
          </button>
        } @else if (colonne.titre; as titre) {
          <abbr [title]="titre">{{ colonne.label }}</abbr>
        } @else {
          {{ colonne.label }}
        }
      </th>
    }
    <th scope="col"><span class="sr-only">Actions</span></th>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryEnteteComponent {
  readonly colonnes = input.required<readonly LibraryColonneVue<string>[]>();
  readonly trier = output<string>();
}
