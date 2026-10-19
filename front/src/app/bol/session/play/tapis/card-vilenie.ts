import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {extractApiErrorMessage} from '../../../../core/api-error.utils';
import {BolFightSessionService} from '../../../services/bol-fight-session.service';
import {libellePoints} from '../../combat-attack.util';
import {heroismeGems} from '../../heroisme-spend.util';
import {TapisCard} from '../../models/tapis.model';

/** Points de vilénie d'un PNJ rival, dans sa carte dépliée : une rangée de gemmes et − / +, enregistrés à chaque pas. Pour ce qui
 * se dépense hors d'un jet d'attaque : fuite opportune, coup de chance, défier la mort (04-pnj-creatures-demons.md). Pendant un
 * enregistrement, un second pas est ignoré sans faire pâlir les boutons ; seul − à 0 point est grisé (`aria-disabled`). */
@Component({
  selector: 'bol-card-vilenie',
  template: `
    <span class="cvl-label" id="cvl-label">Vilénie</span>
    <div class="cvl-ligne" role="group" aria-labelledby="cvl-label">
      <button
        type="button"
        class="cvl-step"
        [attr.aria-label]="'Dépenser 1 point de vilénie de ' + card().nom"
        [attr.aria-disabled]="points() <= 0 ? 'true' : null"
        (click)="step(-1)"
      >
        −
      </button>
      <span class="cvl-gemmes" role="img" [attr.aria-label]="libelle()">
        @for (allumee of gemmes(); track $index) {
          <i class="cvl-gemme" [class.cvl-gemme--on]="allumee"></i>
        }
      </span>
      <button
        type="button"
        class="cvl-step"
        [attr.aria-label]="'Rendre 1 point de vilénie à ' + card().nom"
        (click)="step(1)"
      >
        +
      </button>
    </div>
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

    .cvl-ligne {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .cvl-gemmes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.2rem;
    }

    // La vilénie, en braise : le pendant sombre des gemmes d'héroïsme.
    .cvl-gemme {
      width: 0.75rem;
      height: 1rem;
      background: var(--dw-surface-300);
      clip-path: polygon(50% 0, 100% 38%, 50% 100%, 0 38%);
    }

    .cvl-gemme--on {
      background: linear-gradient(160deg, #fca5a5, var(--dw-color-echec) 55%, #7f1d1d);
    }

    .cvl-step {
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      border: 1px solid var(--dw-border);
      border-radius: 50%;
      background: transparent;
      color: var(--dw-surface-600);
      font: inherit;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;

      &:hover:not([aria-disabled='true']) {
        border-color: var(--dw-color-legendary);
        color: var(--dw-color-legendary);
      }

      &:focus-visible {
        outline: 2px solid var(--dw-color-legendary);
        outline-offset: 1px;
      }

      &[aria-disabled='true'] {
        opacity: 0.35;
        cursor: default;
      }
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
  /** Un pas a été enregistré : le parent recharge la session. */
  readonly changed = output<void>();

  private readonly busy = signal(false);
  protected readonly points = computed(() => this.card().vilenie ?? 0);
  protected readonly gemmes = computed(() => heroismeGems(this.points()));
  protected readonly libelle = computed(() => libellePoints('pnj', this.points()));

  protected step(delta: number): void {
    if (this.busy() || (delta < 0 && this.points() <= 0)) {
      return;
    }
    this.busy.set(true);
    this.fightSessionService.adjustVilenie(this.sessionId(), this.card().pivotId, delta).subscribe({
      next: () => {
        this.busy.set(false);
        this.changed.emit();
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.snackBar.open(extractApiErrorMessage(error, 'Impossible de mettre à jour la vilénie.'), 'Fermer', {duration: 5000});
      },
    });
  }
}
