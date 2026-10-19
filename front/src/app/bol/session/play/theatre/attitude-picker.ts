import {ChangeDetectionStrategy, Component, inject, input, output, signal} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {CombatantAttitude} from '../../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {TapisCard} from '../../models/tapis.model';
import {ATTITUDES} from './theatre.util';

/** L'attitude envers les héros d'un PNJ, d'une créature ou d'un démon en scène, dans sa carte dépliée : quatre
 * boutons bascule ; un nouveau clic sur l'attitude choisie l'efface. Enregistrée aussitôt ; pendant l'enregistrement, un
 * autre choix est ignoré, sans faire pâlir les boutons (ce scintillement à chaque clic laissait croire à une panne). */
@Component({
  selector: 'bol-attitude-picker',
  template: `
    <span class="atp-label" id="atp-label">Attitude envers les héros</span>
    <div class="atp-choix" role="group" aria-labelledby="atp-label">
      @for (option of options; track option.value) {
        <button
          type="button"
          [class]="'atp-option atp-option--' + option.value"
          [attr.aria-pressed]="card().attitude === option.value"
          (click)="choose(option.value)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .atp-label {
      color: var(--dw-surface-600);
      font-size: 0.75rem;
    }

    .atp-choix {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }

    .atp-option {
      --atp-couleur: var(--dw-surface-500);

      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.55rem 0.2rem 0.4rem;
      border: 1px solid var(--dw-border);
      border-radius: var(--dw-radius-toggle);
      background: transparent;
      color: var(--dw-surface-700);
      font: inherit;
      font-size: 0.78rem;
      cursor: pointer;

      &::before {
        content: '';
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background: var(--atp-couleur);
      }

      &[aria-pressed='true'] {
        border-color: var(--atp-couleur);
        background: color-mix(in srgb, var(--atp-couleur) 18%, transparent);
        color: var(--dw-color-text-bright);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 2px;
      }

      &[aria-disabled='true'] {
        cursor: progress;
      }
    }

    .atp-option--hostile {
      --atp-couleur: var(--dw-color-echec);
    }

    .atp-option--mefiant {
      --atp-couleur: var(--dw-color-warn);
    }

    .atp-option--amical {
      --atp-couleur: var(--dw-color-reussite);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttitudePickerComponent {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  readonly sessionId = input.required<string>();
  readonly card = input.required<TapisCard>();
  /** L'attitude a été enregistrée : la page recharge la session. */
  readonly changed = output<void>();

  protected readonly options = ATTITUDES;
  private readonly busy = signal(false);

  protected choose(value: CombatantAttitude): void {
    const card = this.card();
    if (card.kind === 'hero' || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.fightSessionService.setAttitude(this.sessionId(), card.kind, card.pivotId, card.attitude === value ? null : value).subscribe({
      next: () => {
        this.busy.set(false);
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.snackBar.open(extractApiErrorMessage(error, "Impossible de changer l'attitude."), 'Fermer', {duration: 5000});
      },
    });
  }
}
