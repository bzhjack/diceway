import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TurnStatus} from '../../models/combat-turn.model';
import {TurnOrderEntry} from '../../models/turn-order.model';
import {groupByTier} from './combat-turn.util';

const STATUS_LABELS: Record<TurnStatus, string> = {
  active: 'à elle de jouer',
  played: 'a joué',
  skipped: 'ne joue pas ce round',
  upcoming: 'à venir',
};

/** Frise d'initiative : le round, puis les combattants rangés par rang de réaction BoL (héros qui ont réussi,
 * rivaux, coriaces, héros en échec, piétaille, échec critique). Chaque combattant est un médaillon : le
 * combattant actif est surélevé, ceux qui ont joué sont grisés. Un clic sur un médaillon « a joué » lui rend la main. */
@Component({
  selector: 'bol-turn-order',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './turn-order.html',
  styleUrl: './turn-order.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnOrderComponent {
  readonly entries = input.required<readonly TurnOrderEntry[]>();
  readonly round = input.required<number>();
  /** Un héros a obtenu un succès légendaire : +1 à tous les jets d'attaque de la rencontre. */
  readonly legendaryActive = input(false);
  /** Texte annoncé aux lecteurs d'écran à chaque changement de tour ou de round. */
  readonly announcement = input('');

  readonly gaveBack = output<string>();
  readonly addRequested = output<void>();

  protected readonly groups = computed(() => groupByTier(this.entries()));
  /** Au round 1, un succès héroïque bloque coriaces et piétaille : la frise le dit. */
  protected readonly roundOneLock = computed(() => this.round() === 1 && this.entries().some((entry) => entry.locked));

  protected statusLabel(status: TurnStatus): string {
    return STATUS_LABELS[status];
  }

  protected initial(entry: TurnOrderEntry): string {
    return entry.nom.trim().charAt(0).toUpperCase();
  }

  protected label(entry: TurnOrderEntry): string {
    return `${entry.nom}, ${this.statusLabel(entry.status)}${entry.locked ? ', bloqué ce round' : ''}`;
  }
}
