import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatSelectModule} from '@angular/material/select';
import {LibraryTri, LibraryTriOption} from '../../models/library-rows.model';

/**
 * Le tri d'une bibliothèque en tuiles, dans sa barre de recherche (`dwToolbarFilter`) : la liste « Trier par », puis un bouton rond qui
 * inverse le sens (son nom dit le sens actuel). Les styles sont ceux de `styles/_library-rows.scss`.
 */
@Component({
  selector: 'bol-library-tri',
  imports: [MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule],
  template: `
    <mat-form-field class="dw-lr-select-barre" subscriptSizing="dynamic">
      <mat-select aria-label="Trier par" panelClass="dw-lr-select-panel" [panelWidth]="null" [value]="tri().cle" (valueChange)="cle.emit($event)">
        <mat-select-trigger>Trier par : {{ libelle() }}</mat-select-trigger>
        @for (option of options(); track option.cle) {
          <mat-option [value]="option.cle">{{ option.label }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
    <button
      mat-icon-button
      type="button"
      class="dw-lr-sens"
      [attr.aria-label]="tri().croissant ? 'Ordre croissant, inverser' : 'Ordre décroissant, inverser'"
      (click)="inverser.emit()"
    >
      <mat-icon>{{ tri().croissant ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
    </button>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryTriComponent<TTri extends string = string> {
  readonly options = input.required<readonly LibraryTriOption<TTri>[]>();
  readonly tri = input.required<LibraryTri<TTri>>();
  /** La clé choisie dans la liste : une de celles d'`options`. */
  readonly cle = output<TTri>();
  readonly inverser = output<void>();

  protected readonly libelle = computed(() => this.options().find((o) => o.cle === this.tri().cle)?.label ?? '');
}
