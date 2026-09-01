import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

/**
 * Actions rapides sur l'avatar d'un héros en mode libre (hors combat) : jet d'action, ajustement
 * rapide des stats — un clic direct chacune (survol/focus sur souris, toujours visibles sur tactile,
 * cf. `hero-action-menu.scss`). La fiche (statbloc) est couverte par le bouton "Carte" générique de
 * `session-play-page` (tous types de jetons), donc pas dupliquée ici.
 */
@Component({
  selector: 'bol-hero-action-menu',
  imports: [MatIconModule],
  templateUrl: './hero-action-menu.html',
  styleUrl: './hero-action-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroActionMenuComponent {
  readonly heroName = input.required<string>();

  readonly actionRoll = output<void>();
  readonly adjustStats = output<void>();
}
