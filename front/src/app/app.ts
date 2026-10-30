import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';

/** Icônes SVG custom enregistrées globalement (utilisables via `<mat-icon svgIcon="...">`). */
const CUSTOM_SVG_ICONS: Record<string, string> = {
  sword: '/assets/icons/sword.svg',
  d6: '/assets/icons/d6.svg',
  skull: '/assets/icons/skull.svg',
  crown: '/assets/icons/crown.svg',
  // game-icons.net, CC BY 3.0 : crédit à afficher (voir assets/icons/game-icons/README.md).
  'gi-dice': '/assets/icons/game-icons/perspective-dice-six-faces-three.svg',
  'gi-tune': '/assets/icons/game-icons/settings-knobs.svg',
  'gi-sheet': '/assets/icons/game-icons/scroll-unfurled.svg',
  'gi-exit': '/assets/icons/game-icons/exit-door.svg',
  'gi-return': '/assets/icons/game-icons/return-arrow.svg',
  'gi-heart': '/assets/icons/game-icons/hearts.svg',
  'gi-info': '/assets/icons/game-icons/info.svg',
  'gi-swords': '/assets/icons/game-icons/crossed-swords.svg',
  'gi-favor': '/assets/icons/game-icons/sunbeams.svg',
  'gi-laurels': '/assets/icons/game-icons/laurels.svg',
  'gi-warning': '/assets/icons/game-icons/hazard-sign.svg',
  'gi-skull': '/assets/icons/game-icons/death-skull.svg',
  'gi-crown': '/assets/icons/game-icons/queen-crown.svg',
};

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    const iconRegistry = inject(MatIconRegistry);
    const sanitizer = inject(DomSanitizer);
    for (const [name, path] of Object.entries(CUSTOM_SVG_ICONS)) {
      iconRegistry.addSvgIcon(name, sanitizer.bypassSecurityTrustResourceUrl(path));
    }
  }
}
