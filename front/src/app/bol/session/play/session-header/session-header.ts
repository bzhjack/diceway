import {ChangeDetectionStrategy, Component, inject, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {Router, RouterLink} from '@angular/router';

/** Raccourcis vers les bibliothèques (modifier une fiche sans quitter la session) — même mapping
 * d'icônes que les badges de jeton/frise (`combat-statblock.util.ts`). */
export interface LibraryShortcut {
  readonly label: string;
  readonly icon: string;
  readonly iconIsSvg: boolean;
  readonly link: string;
}

const LIBRARY_SHORTCUTS: readonly LibraryShortcut[] = [
  {label: 'Héros', icon: 'sword', iconIsSvg: true, link: '/library/heroes'},
  {label: 'PNJ', icon: 'group', iconIsSvg: false, link: '/library/pnjs'},
  {label: 'Créatures', icon: 'pets', iconIsSvg: false, link: '/library/creatures'},
  {label: 'Démons', icon: 'bolt', iconIsSvg: false, link: '/library/demons'},
];

/** En-tête de l'écran de combat : retour, titre, raccourcis bibliothèques, actions principales
 * (démarrer/terminer un combat, ajouter un héros) et bannière de succès légendaire — tout ce qui
 * reste visible en permanence en haut de l'écran, indépendamment du contenu du plateau. */
@Component({
  selector: 'bol-session-header',
  imports: [MatIconModule, MatTooltipModule, RouterLink],
  templateUrl: './session-header.html',
  styleUrl: './session-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionHeaderComponent {
  private readonly router = inject(Router);

  readonly mode = input.required<'libre' | 'combat'>();
  readonly titre = input<string | null>(null);
  /** Succès légendaire obtenu cette rencontre (`PlayBoard.legendaryActive`) — bannière visible uniquement en combat. */
  readonly legendaryActive = input(false);

  readonly startCombat = output<void>();
  readonly endCombat = output<void>();
  readonly addHero = output<void>();

  protected readonly libraryShortcuts = LIBRARY_SHORTCUTS;

  /** État de navigation transmis aux raccourcis bibliothèque : revenir sur cette session (et non le
   * dashboard) depuis leur bouton "Retour" (`readReturnUrl`/`BolEntityFormPageBase`). */
  protected libraryShortcutState(): Record<string, string> {
    return {returnUrl: this.router.url};
  }
}
