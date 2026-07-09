import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';

export type DwRowTone = 'neutral' | 'positive' | 'negative';

@Component({
  selector: 'dw-collapsible-row',
  imports: [MatIconModule],
  templateUrl: './dw-collapsible-row.html',
  styleUrl: './dw-collapsible-row.scss',
  host: {
    class: 'dw-row',
    '[class.dw-row--positive]': "tone() === 'positive'",
    '[class.dw-row--negative]': "tone() === 'negative'",
    '[class.dw-row--expanded]': 'expandable() && expanded()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwCollapsibleRowComponent {
  readonly tone = input<DwRowTone>('neutral');
  readonly expanded = input(false);
  readonly expandable = input(true);
  readonly ariaLabel = input<string | null>(null);
  readonly toggled = output<void>();
}
