import {ChangeDetectionStrategy, Component, input, model, output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'dw-library-toolbar',
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './dw-library-toolbar.html',
  styleUrl: './dw-library-toolbar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwLibraryToolbarComponent {
  readonly searchTerm = model<string>('');
  readonly checked = model<boolean>(false);
  readonly placeholder = input<string>('Rechercher');
  readonly checkboxLabel = input<string>('Mes créations');
  readonly cleared = output<void>();

  protected clear(): void {
    this.searchTerm.set('');
    this.checked.set(false);
    this.cleared.emit();
  }
}
