import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {DwBadgeColor} from '../models/dw-badge.model';

@Component({
  selector: 'dw-badge',
  template: `<ng-content />`,
  host: {
    '[class]': '"dw-badge dw-badge--" + color()',
  },
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      border: 1px solid var(--dw-badge-border);
      background: var(--dw-badge-bg);
      padding: 0.1rem 0.5rem;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--dw-badge-color);
      white-space: nowrap;
    }

    :host.dw-badge--amber {
      --dw-badge-border: rgba(251, 191, 36, 0.3);
      --dw-badge-bg: rgba(251, 191, 36, 0.1);
      --dw-badge-color: #fde68a;
    }

    :host.dw-badge--sky {
      --dw-badge-border: rgba(217, 164, 65, 0.3);
      --dw-badge-bg: rgba(217, 164, 65, 0.1);
      --dw-badge-color: #bae6fd;
    }

    :host.dw-badge--rose {
      --dw-badge-border: rgba(251, 113, 133, 0.35);
      --dw-badge-bg: rgba(251, 113, 133, 0.1);
      --dw-badge-color: #fda4af;
    }

    :host.dw-badge--emerald {
      --dw-badge-border: rgba(52, 211, 153, 0.3);
      --dw-badge-bg: rgba(52, 211, 153, 0.1);
      --dw-badge-color: #6ee7b7;
    }

    :host.dw-badge--neutral {
      --dw-badge-border: rgba(156, 135, 99, 0.3);
      --dw-badge-bg: rgba(156, 135, 99, 0.1);
      --dw-badge-color: #b59d78;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DwBadgeComponent {
  readonly color = input<DwBadgeColor>('neutral');
}