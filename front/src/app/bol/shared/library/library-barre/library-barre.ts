import {ChangeDetectionStrategy, Component, input, model, output} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatTooltipModule} from '@angular/material/tooltip';

/**
 * La barre d'une bibliothèque en tuiles, sous son en-tête, sur une ligne : la recherche ; les filtres que la page projette (la source
 * côte à côte, puis chacun en liste, qui dit sa valeur dès qu'elle est choisie) ; le compte des fiches gardées ; un bouton rond qui
 * retire tous les filtres. Les styles sont ceux de `styles/_library-rows.scss`.
 */
@Component({
  selector: 'bol-library-barre',
  imports: [FormField, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTooltipModule],
  host: {class: 'dw-lr-barre'},
  template: `
    <mat-form-field class="dw-lr-recherche" subscriptSizing="dynamic">
      <mat-icon matPrefix>search</mat-icon>
      <input matInput type="text" [formField]="searchField" [placeholder]="placeholder()" [attr.aria-label]="placeholder()" />
    </mat-form-field>

    <ng-content />

    <span class="dw-lr-separateur" aria-hidden="true"></span>
    <span class="dw-lr-nombre" aria-live="polite">{{ nombre() }}</span>
    @if (actifs()) {
      <button mat-icon-button type="button" class="dw-lr-effacer" aria-label="Effacer les filtres" matTooltip="Effacer les filtres" (click)="effacer.emit()">
        <mat-icon>filter_alt_off</mat-icon>
      </button>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryBarreComponent {
  readonly placeholder = input('Rechercher');
  readonly searchTerm = model('');
  /** Ce que la barre dit du compte : « 16 sur 62 démons ». */
  readonly nombre = input.required<string>();
  /** Un filtre est posé (la recherche comprise) : le bouton qui les retire tous paraît. */
  readonly actifs = input(false);
  readonly effacer = output<void>();

  protected readonly searchField = form(this.searchTerm);
}
