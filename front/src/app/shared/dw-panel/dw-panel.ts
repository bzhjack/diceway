import {ChangeDetectionStrategy, Component, input} from '@angular/core';

@Component({
  selector: 'dw-panel',
  templateUrl: './dw-panel.html',
  styleUrl: './dw-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwPanelComponent {
  readonly title = input.required<string>();
}
