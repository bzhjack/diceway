import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';
import {AccountMenuComponent} from '../../../shared/account-menu/account-menu';
import {TurnOrderInterrupter} from '../../models/turn-order.model';
import {MeleeDisponibilite} from '../../models/melee-pietaille.model';

/** Barre du haut de la table : titre de la session, contenu projeté par la page (la frise des actes en mode libre, l'ordre d'action
 * en combat), recherche, commandes du round et fin du combat, retour à l'accueil, menu compte — ce qui reste visible en permanence, indépendamment du contenu du plateau. */
@Component({
  selector: 'bol-session-header',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTooltipModule, AccountMenuComponent],
  templateUrl: './session-header.html',
  styleUrl: './session-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionHeaderComponent {
  readonly mode = input.required<'libre' | 'combat'>();
  readonly titre = input<string | null>(null);
  /** En combat : les héros qui ont retardé leur action ce round, chacun peut l'interrompre pour agir tout de suite. */
  readonly interrupters = input<readonly TurnOrderInterrupter[]>([]);
  /** En combat : la « Mêlée de piétaille », absente sans piétaille debout des deux côtés, grisée une fois faite ce round. */
  readonly melee = input<MeleeDisponibilite>('absente');

  readonly endCombat = output<void>();
  /** Ouvre la barre de commande (même effet que les raccourcis `/` et `Ctrl+K`). */
  readonly searchRequested = output<void>();
  /** En combat : un héros qui a retardé son action interrompt (clé de sa carte). */
  readonly interruptRequested = output<string>();
  /** En combat : un nouveau jet de réaction des héros. */
  readonly rerollRequested = output<void>();
  /** En combat : la piétaille des deux camps s'affronte (« Mêlée de piétaille »). */
  readonly meleeRequested = output<void>();
}
