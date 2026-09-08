import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {RouterLink} from '@angular/router';

/** En-tête de l'écran de combat : retour, titre, actions principales (démarrer/terminer un combat,
 * ajouter un héros) et bannière de succès légendaire — tout ce qui reste visible en permanence en
 * haut de l'écran, indépendamment du contenu du plateau. */
@Component({
  selector: 'bol-session-header',
  imports: [MatIconModule, RouterLink],
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
  readonly addHero = output<void>();
}
