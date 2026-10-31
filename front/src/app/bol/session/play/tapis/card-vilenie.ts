import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {TableChange} from '../../models/table-change.model';
import {TapisCard} from '../../models/tapis.model';
import {PointsStepperComponent} from './points-stepper';

/** Points de vilénie d'un PNJ rival, dans sa carte dépliée : une rangée de gemmes et − / +, enregistrés à chaque pas. Pour ce qui
 * se dépense hors d'un jet d'attaque : fuite opportune, coup de chance, défier la mort (04-pnj-creatures-demons.md). Pendant un
 * enregistrement, un second pas est ignoré sans faire pâlir les boutons ; seul − à 0 point est grisé (`bol-points-stepper`). */
@Component({
  selector: 'bol-card-vilenie',
  imports: [PointsStepperComponent],
  template: `
    <span class="cvl-label" id="cvl-label">Vilénie</span>
    <bol-points-stepper role="group" aria-labelledby="cvl-label" [kind]="card().kind" [points]="points()" [nom]="card().nom" (stepped)="step($event)" />
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .cvl-label {
      color: var(--dw-surface-600);
      font-size: 0.75rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardVilenieComponent {
  private readonly fightSessionService = inject(BolFightSessionService);
  private readonly snackBar = inject(MatSnackBar);

  readonly sessionId = input.required<string>();
  /** La carte d'un PNJ rival (sa vilénie n'est pas nulle). */
  readonly card = input.required<TapisCard>();
  /** Un pas a été enregistré : le parent met la session à jour. */
  readonly changed = output<TableChange>();

  private readonly busy = signal(false);
  protected readonly points = computed(() => this.card().vilenie ?? 0);

  protected step(delta: number): void {
    if (this.busy() || (delta < 0 && this.points() <= 0)) {
      return;
    }
    this.busy.set(true);
    this.fightSessionService.adjustVilenie(this.sessionId(), this.card().pivotId, delta).subscribe({
      next: (session) => {
        this.busy.set(false);
        this.changed.emit({session});
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vilénie.'), 'Fermer', {duration: 5000});
      },
    });
  }
}
