import {ChangeDetectionStrategy, Component, input, model} from '@angular/core';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {LibraryOption, LibraryRang} from '../../models/library-rows.model';

/**
 * Le rang d'une bibliothèque en lignes, en liste dans sa barre de recherche (`dwToolbarFilter`) : « Tous les rangs », puis chaque rang.
 * Les styles sont ceux de `styles/_library-rows.scss`.
 */
@Component({
  selector: 'bol-library-rang',
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field class="dw-lr-select-barre" subscriptSizing="dynamic">
      <mat-select
        aria-label="Rang"
        placeholder="Tous les rangs"
        panelClass="dw-lr-select-panel"
        [panelWidth]="null"
        [value]="rang()"
        (valueChange)="rang.set($event)"
      >
        <mat-option [value]="null">Tous les rangs</mat-option>
        @for (r of rangs(); track r.cle) {
          <mat-option [value]="r.cle">{{ r.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryRangComponent {
  readonly rangs = input.required<readonly LibraryOption<LibraryRang>[]>();
  readonly rang = model.required<LibraryRang | null>();
}
