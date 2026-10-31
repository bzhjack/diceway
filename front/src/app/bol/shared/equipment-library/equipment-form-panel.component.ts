import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';

/** La carte du formulaire d'un catalogue d'équipement : son titre, ses boutons et son erreur ; les champs sont projetés. */
@Component({
  selector: 'bol-equipment-form-panel',
  imports: [MatButtonModule, MatCard, MatCardContent, MatIconModule],
  template: `
    <mat-card appearance="outlined">
      <mat-card-content>
        <div class="space-y-4">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-1">
              <p class="epf-eyebrow">Intendance</p>
              <h2 class="epf-title">{{ title() }}</h2>
            </div>

            <div class="flex flex-wrap gap-2">
              <button mat-stroked-button (click)="cancelled.emit()">
                <mat-icon>close</mat-icon> Annuler
              </button>
              <button mat-flat-button [disabled]="submitting()" (click)="submitted.emit()">
                <mat-icon svgIcon="gi-check" /> {{ submitLabel() }}
              </button>
            </div>
          </div>

          <ng-content />

          @if (error()) {
            <p class="epf-error">{{ error() }}</p>
          }
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
    }

    .epf-eyebrow {
      margin: 0;
      font-size: 0.75rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--dw-forge-gold);
    }

    .epf-title {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      line-height: 1;
      color: var(--dw-forge-name);
    }

    .epf-error {
      margin: 0;
      font-size: 0.875rem;
      color: var(--dw-forge-error-text);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentFormPanelComponent {
  readonly title = input.required<string>();
  readonly submitLabel = input.required<string>();
  readonly submitting = input(false);
  readonly error = input('');

  readonly cancelled = output<void>();
  readonly submitted = output<void>();
}
