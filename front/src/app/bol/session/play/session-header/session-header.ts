import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {AccountMenuComponent} from '../../../shared/account-menu/account-menu';

/** Barre du haut de la table : titre de la session, action de combat, menu compte, et bannière de
 * succès légendaire — ce qui reste visible en permanence, indépendamment du contenu du plateau. */
@Component({
  selector: 'bol-session-header',
  imports: [MatIconModule, AccountMenuComponent],
  templateUrl: './session-header.html',
  styleUrl: './session-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionHeaderComponent {
  readonly mode = input.required<'libre' | 'combat'>();
  readonly titre = input<string | null>(null);
  /** Succès légendaire obtenu cette rencontre (`PlayBoard.legendaryActive`) — bannière visible uniquement en combat. */
  readonly legendaryActive = input(false);

  readonly startCombat = output<void>();
  readonly endCombat = output<void>();
}
