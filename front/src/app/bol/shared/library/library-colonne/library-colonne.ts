import {ChangeDetectionStrategy, Component, input, model} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';

/**
 * La colonne d'une bibliothèque en tuiles, à gauche, toujours en vue sous l'en-tête de la page (seules les tuiles défilent) : la
 * recherche, puis les filtres, projetés, qui défilent seuls s'ils dépassent. Les styles sont ceux de `styles/_library-rows.scss`.
 */
@Component({
  selector: 'bol-library-colonne',
  imports: [FormField, MatFormFieldModule, MatIconModule, MatInputModule],
  host: {class: 'dw-lr-colonne'},
  template: `
    <mat-form-field class="dw-lr-recherche" subscriptSizing="dynamic">
      <mat-icon matPrefix>search</mat-icon>
      <input matInput type="text" [formField]="searchField" [placeholder]="placeholder()" [attr.aria-label]="placeholder()" />
    </mat-form-field>
    <div class="dw-lr-filtres"><ng-content /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryColonneComponent {
  readonly placeholder = input('Rechercher');
  readonly searchTerm = model('');

  protected readonly searchField = form(this.searchTerm);
}
