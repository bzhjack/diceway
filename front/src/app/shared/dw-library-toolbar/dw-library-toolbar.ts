import {ChangeDetectionStrategy, Component, input, model, output} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'dw-library-toolbar',
  imports: [FormField, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './dw-library-toolbar.html',
  styleUrl: './dw-library-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwLibraryToolbarComponent {
  readonly searchTerm = model<string>('');
  readonly checked = model<boolean>(false);
  readonly placeholder = input<string>('Rechercher');
  readonly checkboxLabel = input<string>('Mes créations');
  /** Sans filtre, la barre se réduit à la recherche et au compteur (bibliothèque des sessions). */
  readonly withFilters = input(true);
  readonly cleared = output<void>();

  protected readonly searchField = form(this.searchTerm);
  protected readonly checkedField = form(this.checked);

  protected clear(): void {
    this.searchTerm.set('');
    this.checked.set(false);
    this.cleared.emit();
  }
}
