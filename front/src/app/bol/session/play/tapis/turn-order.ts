import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {MatTooltipModule} from '@angular/material/tooltip';
import {TurnOrderEntry} from '../../models/turn-order.model';
import {OrdreFriseComponent} from '../../ordre-frise/ordre-frise';
import {turnOrderFrise} from './combat-turn.util';

/** Barre d'initiative : le round, puis l'ordre d'action en frise (la même que sur la page du jet de réaction), rang après rang de
 * réaction BoL (héros qui ont réussi, rivaux, coriaces, héros en échec, piétaille, échec critique). Le combattant actif est auréolé,
 * ceux qui ont joué s'estompent ; un clic sur un médaillon « a joué » lui rend la main. */
@Component({
  selector: 'bol-turn-order',
  imports: [MatTooltipModule, OrdreFriseComponent],
  templateUrl: './turn-order.html',
  styleUrl: './turn-order.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnOrderComponent {
  readonly entries = input.required<readonly TurnOrderEntry[]>();
  readonly round = input.required<number>();
  /** Un héros a obtenu un succès légendaire : au round 1, la pastille du blocage le nomme à la place du succès héroïque. */
  readonly legendaryActive = input(false);
  /** Texte annoncé aux lecteurs d'écran à chaque changement de tour ou de round. */
  readonly announcement = input('');
  /** Clé du combattant visé par le tour en cours : son médaillon est cerclé de rouge. */
  readonly targetKey = input<string | null>(null);

  readonly gaveBack = output<string>();
  readonly addRequested = output<void>();

  /** Les médaillons de la frise, dans l'ordre où ils jouent. */
  protected readonly steps = computed(() => turnOrderFrise(this.entries(), this.targetKey()));
  /** Au round 1, un succès héroïque bloque coriaces et piétaille : la frise le dit. */
  protected readonly roundOneLock = computed(() => this.round() === 1 && this.entries().some((entry) => entry.locked));
}
