import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';
import {DwBadgeColor} from '../dw-badge/dw-badge';

@Component({
  selector: 'dw-library-header',
  imports: [MatCard, MatCardContent],
  templateUrl: './dw-library-header.html',
  styleUrl: './dw-library-header.scss',
  host: {
    '[class]': '"dw-lh-color-" + color()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwLibraryHeaderComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly kicker = input<string>('Bibliothèque BOL');
  readonly color = input<DwBadgeColor>('amber');
  /** Illustration de bannière optionnelle (même traitement que le header du dashboard). */
  readonly image = input<string | null>(null);

  protected readonly backgroundImage = computed(() => {
    const src = this.image();
    return src
      ? `linear-gradient(to right, rgba(12, 10, 6, 0.55) 0%, rgba(12, 10, 6, 0.25) 45%, rgba(12, 10, 6, 0.15) 100%), ` +
        `linear-gradient(to top, rgba(12, 10, 6, 0.75) 0%, rgba(12, 10, 6, 0) 35%), ` +
        `url(${src})`
      : null;
  });
}
