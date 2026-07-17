import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';

/** Icônes SVG custom enregistrées globalement (utilisables via `<mat-icon svgIcon="...">`). */
const CUSTOM_SVG_ICONS: Record<string, string> = {
  sword: '/assets/icons/sword.svg',
  d6: '/assets/icons/d6.svg',
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
