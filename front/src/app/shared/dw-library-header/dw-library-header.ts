import {ChangeDetectionStrategy, Component, input} from '@angular/core';
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
}
