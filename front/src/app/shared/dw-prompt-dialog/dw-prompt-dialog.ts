import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {form, FormField, maxLength} from '@angular/forms/signals';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {map, Observable, take} from 'rxjs';
import {DwPromptDialogData} from '../models/dw-prompt-dialog.model';

/** Dialogue à un seul champ texte obligatoire (nommer ou renommer quelque chose). */
@Component({
  selector: 'dw-prompt-dialog',
  imports: [FormField, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <form (submit)="submit($event)">
      <mat-dialog-content>
        <mat-form-field subscriptSizing="dynamic" class="dw-prompt-field">
          <mat-label>{{ data.label }}</mat-label>
          <input
            id="dw-prompt-input"
            matInput
            cdkFocusInitial
            autocomplete="off"
            [formField]="field"
          />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button type="button" mat-dialog-close>Annuler</button>
        <button mat-flat-button type="submit" [disabled]="!valid()">{{ data.confirmLabel ?? 'Valider' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .dw-prompt-field {
      width: min(24rem, 76vw);
      margin-top: 0.4rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DwPromptDialogComponent {
  protected readonly data = inject<DwPromptDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<DwPromptDialogComponent, string>);

  private readonly value = signal(this.data.value ?? '');
  protected readonly field = form(this.value, (path) => maxLength(path, () => this.data.maxLength));
  protected readonly valid = computed(() => /\S/.test(this.value()));

  protected submit(event: Event): void {
    event.preventDefault();
    if (this.valid()) {
      this.ref.close(this.value().trim());
    }
  }
}

/** Ouvre le dialogue de saisie et émet une seule fois la valeur validée, ou `null` si annulé. */
export function promptDialog(dialog: MatDialog, data: DwPromptDialogData): Observable<string | null> {
  return dialog
    .open(DwPromptDialogComponent, {data})
    .afterClosed()
    .pipe(
      take(1),
      map((value: string | undefined) => value ?? null),
    );
}
