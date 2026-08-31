import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';

/**
 * Menu d'action générique sur l'avatar d'un héros en mode libre (hors combat) : jet de compétence,
 * ajustement rapide des stats, accès à la fiche. Auto-contenu comme `bol-attack-menu` (bouton +
 * mat-menu dans le même composant) — la logique métier (dialogs) reste côté page parente.
 */
@Component({
  selector: 'bol-hero-action-menu',
  imports: [MatIconModule, MatMenuModule],
  templateUrl: './hero-action-menu.html',
  styleUrl: './hero-action-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroActionMenuComponent {
  readonly heroName = input.required<string>();

  /** Émis à l'ouverture du menu, pour laisser le parent charger les attributs du héros à la demande. */
  readonly opened = output<void>();
  readonly skillCheck = output<void>();
  readonly adjustStats = output<void>();
  readonly viewSheet = output<void>();
}
