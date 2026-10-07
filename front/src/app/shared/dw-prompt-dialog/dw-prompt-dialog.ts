import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {map, Observable, take} from 'rxjs';
import {DwPromptDialogData} from '../models/dw-prompt-dialog.model';

/** Dialogue à un seul champ texte obligatoire (nommer ou renommer quelque chose). */
@Component({
  selector: 'dw-prompt-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
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
            [formControl]="control"
            [attr.maxlength]="data.maxLength ?? null"
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

  protected readonly control = new FormControl(this.data.value ?? '', {nonNullable: true});
  // Validité en signal : l'état d'un FormControl lu dans un template OnPush ne se rafraîchit pas seul.
  private readonly value = toSignal(this.control.valueChanges, {initialValue: this.control.value});
  protected readonly valid = computed(() => /\S/.test(this.value()));

  /** `(submit)` natif : sans `FormGroupDirective` sur le `<form>`, `(ngSubmit)` n'est jamais émis. */
  protected submit(event: Event): void {
    event.preventDefault();
    if (this.valid()) {
      this.ref.close(this.control.value.trim());
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
