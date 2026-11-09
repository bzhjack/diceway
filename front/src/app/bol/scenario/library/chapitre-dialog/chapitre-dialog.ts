import {TextFieldModule} from '@angular/cdk/text-field';
import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {form, FormField, maxLength} from '@angular/forms/signals';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {Observable} from 'rxjs';
import {ChapitreDialogData, ChapitreDialogResultat} from '../../models/chapitre-dialog.model';

/** Les numéros proposés : l'introduction, puis 1 à 30. « Sans numéro » est la valeur `null`. */
/** La longueur d'un pitch ; ceux des scénarios importés font jusqu'à 1 400 caractères. */
const PITCH_MAX = 2000;

const NUMEROS = [{value: 0, label: 'Introduction'}, ...Array.from({length: 30}, (_, i) => ({value: i + 1, label: String(i + 1)}))];

/** Le tiret cadratin sépare le scénario du chapitre dans un titre d'un seul tenant : il ne peut pas être dans un nom. */
function sansCadratin(texte: string): string {
  return texte.replace(/—/g, '-').trim();
}

/** Un chapitre d'un scénario, à créer ou à modifier : son numéro (l'introduction, un numéro, ou aucun), son nom et son pitch. */
@Component({
  selector: 'bol-chapitre-dialog',
  imports: [FormField, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, TextFieldModule],
  template: `
    <h2 mat-dialog-title>{{ data.titre }}</h2>
    <form (submit)="submit($event)">
      <mat-dialog-content class="chd-contenu">
        <p class="chd-scenario">Scénario : <strong>{{ data.scenario }}</strong></p>
        <div class="chd-ligne">
          <mat-form-field class="chd-numero" subscriptSizing="dynamic">
            <mat-label>Numéro</mat-label>
            <mat-select [formField]="chapitreForm.numero">
              <mat-option [value]="null">Sans numéro</mat-option>
              @for (n of numeros; track n.value) {
                <mat-option [value]="n.value">{{ n.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field class="chd-titre" subscriptSizing="dynamic">
            <mat-label>Nom du chapitre</mat-label>
            <input matInput autocomplete="off" [formField]="chapitreForm.titre" />
          </mat-form-field>
        </div>
        <!-- Le pitch grandit avec son texte, de 8 à 12 lignes : tout le dialogue tient sur l'écran de référence. -->
        <mat-form-field class="chd-pitch" subscriptSizing="dynamic">
          <mat-label>Pitch</mat-label>
          <textarea
            matInput
            cdkTextareaAutosize
            cdkAutosizeMinRows="8"
            cdkAutosizeMaxRows="12"
            [formField]="chapitreForm.pitch"
          ></textarea>
          <mat-hint align="end">{{ longueurDuPitch() }} / {{ pitchMax }}</mat-hint>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button type="submit" [disabled]="!valid()">{{ data.confirmLabel }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .chd-contenu {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      width: min(52rem, 88vw);
      padding-top: 0.5rem !important;
    }

    .chd-scenario {
      margin: 0;
    }

    .chd-ligne {
      display: flex;
      gap: 0.75rem;
    }

    .chd-numero {
      width: 9.5rem;
    }

    .chd-titre {
      flex: 1;
    }

    .chd-pitch textarea {
      line-height: 1.55;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ChapitreDialogComponent {
  protected readonly data = inject<ChapitreDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ChapitreDialogComponent, ChapitreDialogResultat>);
  protected readonly numeros = NUMEROS;
  protected readonly pitchMax = PITCH_MAX;

  private readonly value = signal({numero: this.data.numero, titre: this.data.chapitre, pitch: this.data.pitch});
  protected readonly chapitreForm = form(this.value, (path) => {
    maxLength(path.titre, 150);
    maxLength(path.pitch, PITCH_MAX);
  });
  protected readonly longueurDuPitch = computed(() => this.value().pitch.length);
  protected readonly valid = computed(() => this.chapitreForm().valid() && /\S/.test(this.value().titre));

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.valid()) {
      return;
    }
    const {numero, titre, pitch} = this.value();
    this.ref.close({
      numero,
      titre: sansCadratin(titre),
      pitch: pitch.trim(),
    });
  }
}

/** Ouvre le dialogue d'un chapitre ; émet ce qu'il faut enregistrer, ou `undefined` si annulé. */
export function openChapitreDialog(dialog: MatDialog, data: ChapitreDialogData): Observable<ChapitreDialogResultat | undefined> {
  return dialog
    .open<ChapitreDialogComponent, ChapitreDialogData, ChapitreDialogResultat>(ChapitreDialogComponent, {data, maxWidth: '94vw', autoFocus: 'first-tabbable'})
    .afterClosed();
}
