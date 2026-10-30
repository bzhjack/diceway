import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {AccountMenuComponent} from '../../../shared/account-menu/account-menu';
import {TurnOrderInterrupter} from '../../models/turn-order.model';

/** Barre du haut de la table : titre de la session, contenu projeté par la page (la frise des actes en mode libre, l'ordre d'action
 * en combat), coulisses ou commandes du round, action de combat, menu compte — ce qui reste visible en permanence, indépendamment du contenu du plateau. */
@Component({
  selector: 'bol-session-header',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, AccountMenuComponent],
  templateUrl: './session-header.html',
  styleUrl: './session-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionHeaderComponent {
  readonly mode = input.required<'libre' | 'combat'>();
  readonly titre = input<string | null>(null);
  /** Les coulisses (la réserve) sont ouvertes — mode libre seulement. */
  readonly coulissesOpen = input(false);
  /** En combat : les héros qui ont retardé leur action ce round, chacun peut l'interrompre pour agir tout de suite. */
  readonly interrupters = input<readonly TurnOrderInterrupter[]>([]);

  readonly startCombat = output<void>();
  readonly endCombat = output<void>();
  /** Ouvre la barre de commande (même effet que les raccourcis `/` et `Ctrl+K`). */
  readonly search = output<void>();
  /** Ouvre ou ferme les coulisses. */
  readonly coulissesToggled = output<void>();
  /** En combat : un héros qui a retardé son action interrompt (clé de sa carte). */
  readonly interruptRequested = output<string>();
  /** En combat : un nouveau jet de réaction des héros. */
  readonly rerollRequested = output<void>();
}
