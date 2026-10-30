import {A11yModule} from '@angular/cdk/a11y';
import {CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition} from '@angular/cdk/overlay';
import {ChangeDetectionStrategy, Component, input, output, signal} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {AccountMenuComponent} from '../../../shared/account-menu/account-menu';
import {TurnOrderInterrupter} from '../../models/turn-order.model';
import {DeMj} from '../../models/combat-turn.model';

/** Barre du haut de la table : titre de la session, contenu projeté par la page (la frise des actes en mode libre, l'ordre d'action
 * en combat), coulisses ou commandes du round, action de combat, menu compte — ce qui reste visible en permanence, indépendamment du contenu du plateau. */
@Component({
  selector: 'bol-session-header',
  imports: [A11yModule, CdkConnectedOverlay, CdkOverlayOrigin, MatButtonModule, MatIconModule, MatTooltipModule, AccountMenuComponent],
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
  /** En combat : le dé du MJ pour tous, ajouté à chaque jet d'attaque des héros ; `null` sans. */
  readonly deMj = input<DeMj | null>(null);

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
  /** En combat : le dé du MJ pour tous choisi dans les options (`null` : retiré). */
  readonly deMjChanged = output<DeMj | null>();

  /** Le popover des options du combat. */
  protected readonly optionsOpen = signal(false);
  protected readonly optionsPositions: ConnectedPosition[] = [
    {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 6},
    {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -6},
  ];

  /** Ferme le popover des options et rend le focus à son bouton. */
  protected closeOptions(): void {
    this.optionsOpen.set(false);
    document.getElementById('cp-options-btn')?.focus();
  }

  protected onOptionsKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeOptions();
    }
  }
}
