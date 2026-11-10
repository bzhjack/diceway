import {ChangeDetectionStrategy, Component, inject, input, output, signal} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {CombatantAttitude} from '../../../models/bol-fight-session.model';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {TableChange} from '../../models/table-change.model';
import {TapisCard} from '../../models/tapis.model';
import {AttitudeChoixComponent} from '../../../shared/attitude/attitude-choix';

/** L'attitude envers les héros d'un PNJ, d'une créature ou d'un démon en scène, dans sa carte dépliée (`bol-attitude-choix`).
 * Enregistrée aussitôt ; pendant l'enregistrement, un autre choix est ignoré, sans faire pâlir les boutons (ce scintillement à chaque
 * clic laissait croire à une panne). */
@Component({
  selector: 'bol-attitude-picker',
  imports: [AttitudeChoixComponent],
  template: `
    <span class="atp-label" id="atp-label">Attitude envers les héros</span>
    <bol-attitude-choix labelledBy="atp-label" [attitude]="card().attitude" (choisie)="choose($event)" />
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttitudePickerComponent {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  readonly sessionId = input.required<string>();
  readonly card = input.required<TapisCard>();
  /** L'attitude a été enregistrée : la page met la session à jour. */
  readonly changed = output<TableChange>();

  private readonly busy = signal(false);

  protected choose(attitude: CombatantAttitude | null): void {
    const card = this.card();
    if (card.kind === 'hero' || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.fightSessionService.setAttitude(this.sessionId(), card.kind, card.pivotId, attitude).subscribe({
      next: (session) => {
        this.busy.set(false);
        this.changed.emit({session});
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.snackBar.open(extractApiErrorMessage(error, "Impossible de changer l'attitude."), 'Fermer', {duration: 5000});
      },
    });
  }
}
