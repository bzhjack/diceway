import {ChangeDetectionStrategy, Component, effect, inject, input, output} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {DwValueStepperComponent} from '../../../../shared/value-stepper/value-stepper';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {ValueTracker} from '../../value-tracker';
import {TableChange} from '../../models/table-change.model';
import {TapisKind} from '../../models/tapis.model';

/** Vitalité d'un PNJ, d'une créature ou d'un démon, ajustable par stepper et persistée à chaque pas. La
 * valeur affichée suit chaque rechargement de la session. */
@Component({
  selector: 'bol-card-vitalite',
  imports: [ReactiveFormsModule, DwValueStepperComponent],
  template: `
    <span class="ivt-label">{{ label() }} ({{ value() }} / {{ max() ?? '—' }})</span>
    <dw-value-stepper
      [formControl]="control"
      [min]="0"
      [max]="max() ?? undefined"
      [ariaLabel]="'Vitalité de ' + nom() + ' ' + label()"
      [heart]="true"
    />
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    // Les boutons du stepper, partagé avec d'autres écrans : des clous de bronze ici seulement.
    dw-value-stepper ::ng-deep .vs__btn {
      border-color: var(--dw-forge-bronze-dim);
      background: var(--dw-forge-stud);
      box-shadow: var(--dw-forge-stud-shadow);
      color: var(--dw-forge-bronze-text);
    }

    .ivt-label {
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--dw-surface-600);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardVitaliteComponent {
  readonly sessionId = input.required<string>();
  readonly kind = input.required<TapisKind>();
  readonly pivotId = input.required<number>();
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly max = input.required<number | null>();
  readonly nom = input.required<string>();
  /** Une valeur a été persistée : le parent met la session à jour. */
  readonly changed = output<TableChange>();

  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly control = new FormControl(0, {nonNullable: true});
  private readonly tracker = new ValueTracker();

  constructor() {
    effect(() => {
      const value = this.value();
      this.tracker.reset(value);
      if (value !== this.control.value) {
        this.control.setValue(value, {emitEvent: false});
      }
    });

    this.control.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => this.onChange(value));
  }

  private onChange(value: number): void {
    const previous = this.tracker.value;
    const delta = this.tracker.take(value);
    if (delta === 0) {
      return;
    }

    this.fightSessionService
      .applyDamage(this.sessionId(), this.kind(), this.pivotId(), delta)
      .subscribe({
        next: (session) => this.changed.emit({session}),
        error: (error: unknown) => {
          this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vitalité.'), 'Fermer', {
            duration: 5000,
          });
          this.tracker.reset(previous);
          this.control.setValue(previous, {emitEvent: false});
        },
      });
  }
}
